<?php

declare(strict_types=1);

namespace Mir\HeadlessCache\Dto;


final readonly class Invalidation
{
    /**
     * @param list<int> $pageIds
     * @param list<int> $subtreeRootPageIds
     * @param list<string> $oldRoutes
     * @param list<array{
     *     table: string,
     *     uid: int,
     *     operation: string
     * }> $records
     */
    public function __construct(
        public array $pageIds,
        public array $subtreeRootPageIds,
        public array $oldRoutes,
        public array $records,
        public bool $invalidateNavigation,
        public bool $invalidateAll,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'eventId' => bin2hex(random_bytes(16)),
            'timestamp' => time(),
            'scope' => $this->invalidateAll ? 'all' : 'targeted',
            'pageIds' => $this->pageIds,
            'subtreeRootPageIds' => $this->subtreeRootPageIds,
            'oldRoutes' => $this->oldRoutes,
            'records' => $this->records,
            'invalidateNavigation' => $this->invalidateNavigation,
        ];
    }
}