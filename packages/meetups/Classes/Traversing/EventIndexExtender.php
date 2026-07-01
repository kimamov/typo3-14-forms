<?php

declare(strict_types=1);

namespace T13\Meetups\Traversing;

use Lochmueller\Index\Configuration\Configuration;
use Lochmueller\Index\Traversing\Extender\ExtenderInterface;
use Lochmueller\Index\Traversing\FrontendInformationDto;
use Lochmueller\Index\Traversing\RecordSelection;
use TYPO3\CMS\Core\Routing\PageRouter;
use TYPO3\CMS\Core\Site\Entity\Site;
use TYPO3\CMS\Core\Site\Entity\SiteLanguage;

/**
 * Extender for EXT:index that adds meetup event detail URLs to the index queue.
 *
 * Configure in an EXT:index index record, e.g.:
 * {
 *   "extender": [
 *     {
 *       "type": "meetups",
 *       "limitToPages": [42],
 *       "recordStorages": [12]
 *     }
 *   ]
 * }
 */
class EventIndexExtender implements ExtenderInterface
{
    public function __construct(
        private readonly RecordSelection $recordSelection,
    ) {}

    /**
     * @param array<string, mixed> $extenderConfiguration
     * @param array<string, mixed> $row
     * @return iterable<FrontendInformationDto>
     */
    public function getItems(
        Configuration $configuration,
        array $extenderConfiguration,
        Site $site,
        int $pageUid,
        SiteLanguage $siteLanguage,
        array $row,
    ): iterable {
        /** @var PageRouter $router */
        $router = $site->getRouter();

        foreach ($this->recordSelection->findRecordsOnPage(
            'tx_meetups_domain_model_event',
            $extenderConfiguration['recordStorages'] ?? [],
            $siteLanguage->getLanguageId()
        ) as $record) {
            $arguments = [
                '_language' => $siteLanguage,
                'tx_meetups_event' => [
                    'action' => 'show',
                    'controller' => 'Event',
                    'event' => $record->getUid(),
                ],
            ];

            yield new FrontendInformationDto(
                uri: $router->generateUri($pageUid, $arguments),
                arguments: $arguments,
                pageUid: $pageUid,
                language: $siteLanguage,
                row: $row,
            );
        }
    }

    public function getName(): string
    {
        return 'meetups';
    }
}
