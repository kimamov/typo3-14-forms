<?php

declare(strict_types=1);

namespace Mir\HeadlessCache\DataHandling;

use Doctrine\DBAL\ParameterType;
use Mir\HeadlessCache\Dto\Invalidation;
use Mir\HeadlessCache\Service\InvalidationDispatcher;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Routing\PageRouter;
use TYPO3\CMS\Core\Site\SiteFinder;
use TYPO3\CMS\Core\Utility\MathUtility;

final class DataHandlerHook
{
    /**
     * Add project-specific records that belong directly to a page through pid.
     *
     * Example:
     *
     * 'tx_site_domain_model_teaser',
     * 'tx_site_domain_model_contact',
     *
     * @var list<string>
     */
    private const PAGE_BOUND_TABLES = [
        'tt_content',
    ];

    /**
     * Changes to these page fields can alter URLs, navigation, visibility,
     * hierarchy or availability.
     *
     * @var list<string>
     */
    private const STRUCTURAL_PAGE_FIELDS = [
        'pid',
        'slug',
        'title',
        'nav_title',
        'hidden',
        'nav_hide',
        'doktype',
        'shortcut',
        'shortcut_mode',
        'starttime',
        'endtime',
        'extendToSubpages',
        'fe_group',
        'is_siteroot',
    ];

    /**
     * @var array<int, true>
     */
    private array $pageIds = [];

    /**
     * Page IDs whose complete subtree must be considered stale.
     *
     * @var array<int, true>
     */
    private array $subtreeRootPageIds = [];

    /**
     * @var array<string, true>
     */
    private array $oldRoutes = [];

    /**
     * @var array<string, array{
     *     table: string,
     *     uid: int,
     *     operation: string
     * }>
     */
    private array $records = [];

    /**
     * Original records captured before DataHandler changes them.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $originalRecords = [];

    private bool $invalidateNavigation = false;

    private bool $invalidateAll = false;

    public function __construct(
        private readonly ConnectionPool $connectionPool,
        private readonly SiteFinder $siteFinder,
        private readonly InvalidationDispatcher $dispatcher,
    ) {}

    /*
     * ---------------------------------------------------------------------
     * DATAMAP
     *
     * Handles record creation and field updates:
     *
     * - page renamed
     * - page slug changed
     * - page hidden/unhidden
     * - content edited
     * - database record edited
     * ---------------------------------------------------------------------
     */

    public function processDatamap_beforeStart(
        DataHandler $dataHandler,
    ): void {
        $this->reset();
    }

    /**
     * Capture the old database state before an existing record is changed.
     *
     * @param array<string, mixed> $fieldArray
     * @param string|int $id
     */
    public function processDatamap_preProcessFieldArray(
        array &$fieldArray,
        string $table,
        string|int $id,
        DataHandler $dataHandler,
    ): void {
        if (!$this->isRelevantTable($table)) {
            return;
        }

        if (!MathUtility::canBeInterpretedAsInteger($id)) {
            // The record does not exist yet.
            return;
        }

        $uid = (int)$id;
        $record = BackendUtility::getRecord($table, $uid, '*');

        if (!is_array($record)) {
            return;
        }

        $this->originalRecords[$this->recordKey($table, $uid)] = $record;

        if (
            $table === 'pages'
            && array_key_exists('slug', $fieldArray)
            && $fieldArray['slug'] !== $record['slug']
        ) {
            $oldRoute = $this->generatePageRoute($uid);

            if ($oldRoute !== null) {
                $this->oldRoutes[$oldRoute] = true;
            }
        }
    }

    /**
     * Called after an insert or update has been persisted.
     *
     * @param string|int $id
     * @param array<string, mixed> $fieldArray
     */
    public function processDatamap_afterDatabaseOperations(
        string $status,
        string $table,
        string|int $id,
        array $fieldArray,
        DataHandler $dataHandler,
    ): void {
        if (!$this->isRelevantTable($table)) {
            return;
        }

        $uid = $this->resolveUid($id, $dataHandler);

        if ($uid === null) {
            return;
        }

        $operation = $status === 'new' ? 'create' : 'update';

        $this->addRecord($table, $uid, $operation);

        if ($table === 'pages') {
            $this->handlePageDatamap(
                $uid,
                $status,
                $fieldArray,
            );

            return;
        }

        $this->handlePageBoundRecordDatamap(
            $table,
            $uid,
            $fieldArray,
        );
    }

    public function processDatamap_afterAllOperations(
        DataHandler $dataHandler,
    ): void {
        $this->dispatchAndReset();
    }

    /*
     * ---------------------------------------------------------------------
     * CMDMAP
     *
     * Handles commands rather than ordinary field writes:
     *
     * - move
     * - delete
     * - undelete
     * - copy
     * ---------------------------------------------------------------------
     */

    public function processCmdmap_beforeStart(
        DataHandler $dataHandler,
    ): void {
        $this->reset();
    }

    /**
     * Capture state that may no longer be available after the command.
     *
     * @param int|string $id
     * @param mixed $value
     * @param mixed $pasteUpdate
     */
    public function processCmdmap_preProcess(
        string $command,
        string $table,
        int|string $id,
        mixed $value,
        DataHandler $dataHandler,
        mixed $pasteUpdate,
    ): void {
        if (!$this->isRelevantTable($table)) {
            return;
        }

        if (!MathUtility::canBeInterpretedAsInteger($id)) {
            return;
        }

        $uid = (int)$id;
        $record = BackendUtility::getRecord($table, $uid, '*', '', false);

        if (!is_array($record)) {
            return;
        }

        $this->originalRecords[$this->recordKey($table, $uid)] = $record;

        if ($table === 'pages') {
            $oldRoute = $this->generatePageRoute($uid);

            if ($oldRoute !== null) {
                $this->oldRoutes[$oldRoute] = true;
            }
        }
    }

    /**
     * @param int|string $id
     * @param mixed $value
     * @param mixed $pasteUpdate
     * @param mixed $pasteDatamap
     */
    public function processCmdmap_postProcess(
        string $command,
        string $table,
        int|string $id,
        mixed $value,
        DataHandler $dataHandler,
        mixed $pasteUpdate,
        mixed $pasteDatamap,
    ): void {
        if (!$this->isRelevantTable($table)) {
            return;
        }

        if (!MathUtility::canBeInterpretedAsInteger($id)) {
            return;
        }

        $uid = (int)$id;

        match ($command) {
            'move' => $this->handleMove($table, $uid, $value),
            'delete' => $this->handleDelete($table, $uid),
            'undelete' => $this->handleUndelete($table, $uid),
            'copy' => $this->handleCopy($table, $uid, $value),
            default => null,
        };
    }

    public function processCmdmap_afterFinish(
        DataHandler $dataHandler,
    ): void {
        $this->dispatchAndReset();
    }

    /*
     * ---------------------------------------------------------------------
     * DATAMAP HANDLERS
     * ---------------------------------------------------------------------
     */

    /**
     * @param array<string, mixed> $fieldArray
     */
    private function handlePageDatamap(
        int $uid,
        string $status,
        array $fieldArray,
    ): void {
        $this->addPage($uid);

        $currentRecord = BackendUtility::getRecord('pages', $uid, '*');

        if (is_array($currentRecord)) {
            $this->addPage((int)$currentRecord['pid']);
        }

        if ($status === 'new') {
            $this->invalidateNavigation = true;
            return;
        }

        $changedFields = array_keys($fieldArray);
        $structuralFieldsChanged = array_intersect(
            self::STRUCTURAL_PAGE_FIELDS,
            $changedFields,
        );

        if ($structuralFieldsChanged === []) {
            return;
        }

        $this->invalidateNavigation = true;

        /*
         * A slug or PID change affects the URLs of all descendants.
         */
        if (
            array_key_exists('slug', $fieldArray)
            || array_key_exists('pid', $fieldArray)
        ) {
            $this->addSubtreeRoot($uid);
        }

        /*
         * If pid was changed through a datamap operation, include the old
         * and new parent pages.
         */
        $original = $this->getOriginalRecord('pages', $uid);

        if ($original !== null) {
            $this->addPage((int)($original['pid'] ?? 0));
        }

        if (is_array($currentRecord)) {
            $this->addPage((int)($currentRecord['pid'] ?? 0));
        }
    }

    /**
     * @param array<string, mixed> $fieldArray
     */
    private function handlePageBoundRecordDatamap(
        string $table,
        int $uid,
        array $fieldArray,
    ): void {
        $currentPid = $this->findPid($table, $uid);

        if ($currentPid > 0) {
            $this->addPage($currentPid);
        }

        /*
         * A record can theoretically change pid via datamap. Include the old
         * page as well as the new one.
         */
        $original = $this->getOriginalRecord($table, $uid);
        $oldPid = (int)($original['pid'] ?? 0);

        if ($oldPid > 0) {
            $this->addPage($oldPid);
        }

        if (isset($fieldArray['pid'])) {
            $this->addPage((int)$fieldArray['pid']);
        }
    }

    /*
     * ---------------------------------------------------------------------
     * CMDMAP HANDLERS
     * ---------------------------------------------------------------------
     */

    private function handleMove(
        string $table,
        int $uid,
        mixed $value,
    ): void {
        $this->addRecord($table, $uid, 'move');

        $original = $this->getOriginalRecord($table, $uid);
        $oldPid = (int)($original['pid'] ?? 0);
        $newPid = $this->resolveDestinationPageId($value);

        $this->addPage($oldPid);
        $this->addPage($newPid);

        if ($table === 'pages') {
            $this->addPage($uid);
            $this->addSubtreeRoot($uid);
            $this->invalidateNavigation = true;

            return;
        }

        /*
         * Moving a content element or page-bound record affects both its old
         * and new pages.
         */
        $currentPid = $this->findPid($table, $uid);
        $this->addPage($currentPid);
    }

    private function handleDelete(
        string $table,
        int $uid,
    ): void {
        $this->addRecord($table, $uid, 'delete');

        $original = $this->getOriginalRecord($table, $uid);
        $oldPid = (int)($original['pid'] ?? 0);

        $this->addPage($oldPid);

        if ($table === 'pages') {
            $this->addPage($uid);
            $this->addSubtreeRoot($uid);
            $this->invalidateNavigation = true;
        }
    }

    private function handleUndelete(
        string $table,
        int $uid,
    ): void {
        $this->addRecord($table, $uid, 'undelete');

        $currentPid = $this->findPid($table, $uid);
        $this->addPage($currentPid);

        if ($table === 'pages') {
            $this->addPage($uid);
            $this->addSubtreeRoot($uid);
            $this->invalidateNavigation = true;
        }
    }

    private function handleCopy(
        string $table,
        int $uid,
        mixed $value,
    ): void {
        /*
         * DataHandler may subsequently run datamap operations for copied
         * records, which will normally capture the new record. We still
         * invalidate the destination because its page tree/content changed.
         */
        $destinationPageId = $this->resolveDestinationPageId($value);

        $this->addPage($destinationPageId);
        $this->addRecord($table, $uid, 'copy');

        if ($table === 'pages') {
            $this->invalidateNavigation = true;
        }
    }

    /*
     * ---------------------------------------------------------------------
     * COLLECTION
     * ---------------------------------------------------------------------
     */

    private function addPage(int $pageId): void
    {
        if ($pageId > 0) {
            $this->pageIds[$pageId] = true;
        }
    }

    private function addSubtreeRoot(int $pageId): void
    {
        if ($pageId > 0) {
            $this->subtreeRootPageIds[$pageId] = true;
        }
    }

    private function addRecord(
        string $table,
        int $uid,
        string $operation,
    ): void {
        $key = $table . ':' . $uid . ':' . $operation;

        $this->records[$key] = [
            'table' => $table,
            'uid' => $uid,
            'operation' => $operation,
        ];
    }

    private function dispatchAndReset(): void
    {
        if (!$this->hasInvalidations()) {
            $this->reset();
            return;
        }

        $invalidation = new Invalidation(
            pageIds: array_map(
                'intval',
                array_keys($this->pageIds),
            ),
            subtreeRootPageIds: array_map(
                'intval',
                array_keys($this->subtreeRootPageIds),
            ),
            oldRoutes: array_keys($this->oldRoutes),
            records: array_values($this->records),
            invalidateNavigation: $this->invalidateNavigation,
            invalidateAll: $this->invalidateAll,
        );

        $this->reset();

        $this->dispatcher->dispatch($invalidation);
    }

    private function hasInvalidations(): bool
    {
        return $this->pageIds !== []
            || $this->subtreeRootPageIds !== []
            || $this->oldRoutes !== []
            || $this->records !== []
            || $this->invalidateNavigation
            || $this->invalidateAll;
    }

    private function reset(): void
    {
        $this->pageIds = [];
        $this->subtreeRootPageIds = [];
        $this->oldRoutes = [];
        $this->records = [];
        $this->originalRecords = [];
        $this->invalidateNavigation = false;
        $this->invalidateAll = false;
    }

    /*
     * ---------------------------------------------------------------------
     * RECORD RESOLUTION
     * ---------------------------------------------------------------------
     */

    private function isRelevantTable(string $table): bool
    {
        return $table === 'pages'
            || in_array($table, self::PAGE_BOUND_TABLES, true);
    }

    private function resolveUid(
        string|int $id,
        DataHandler $dataHandler,
    ): ?int {
        if (MathUtility::canBeInterpretedAsInteger($id)) {
            return (int)$id;
        }

        $resolvedUid = $dataHandler->substNEWwithIDs[$id] ?? null;

        return MathUtility::canBeInterpretedAsInteger($resolvedUid)
            ? (int)$resolvedUid
            : null;
    }

    private function findPid(string $table, int $uid): int
    {
        $queryBuilder = $this->connectionPool
            ->getQueryBuilderForTable($table);

        /*
         * Include deleted records where possible. This can be useful around
         * undelete and command processing.
         */
        $queryBuilder->getRestrictions()->removeAll();

        $pid = $queryBuilder
            ->select('pid')
            ->from($table)
            ->where(
                $queryBuilder->expr()->eq(
                    'uid',
                    $queryBuilder->createNamedParameter(
                        $uid,
                        ParameterType::INTEGER,
                    ),
                ),
            )
            ->executeQuery()
            ->fetchOne();

        return $pid === false ? 0 : (int)$pid;
    }

    private function resolveDestinationPageId(mixed $value): int
    {
        if (!is_scalar($value)) {
            return 0;
        }

        $destination = (int)$value;

        /*
         * TYPO3 uses negative destination values to express positioning
         * relative to another record. Resolve that record's pid.
         */
        if ($destination < 0) {
            $referencePageId = abs($destination);
            $referenceRecord = BackendUtility::getRecord(
                'pages',
                $referencePageId,
                'pid',
            );

            return is_array($referenceRecord)
                ? (int)($referenceRecord['pid'] ?? 0)
                : 0;
        }

        return $destination;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function getOriginalRecord(
        string $table,
        int $uid,
    ): ?array {
        return $this->originalRecords[
            $this->recordKey($table, $uid)
        ] ?? null;
    }

    private function recordKey(string $table, int $uid): string
    {
        return $table . ':' . $uid;
    }

    private function generatePageRoute(int $pageId): ?string
    {
        try {
            $site = $this->siteFinder->getSiteByPageId($pageId);
            $router = $site->getRouter();

            if (!$router instanceof PageRouter) {
                return null;
            }

            return (string)$router->generateUri($pageId);
        } catch (\Throwable) {
            return null;
        }
    }
}