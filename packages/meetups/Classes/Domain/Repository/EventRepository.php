<?php

declare(strict_types=1);

namespace T13\Meetups\Domain\Repository;

use T13\Meetups\Domain\Model\Event;
use TYPO3\CMS\Extbase\Persistence\QueryInterface;
use TYPO3\CMS\Extbase\Persistence\Repository;

/**
 * @extends Repository<Event>
 */
class EventRepository extends Repository
{
    protected $defaultOrderings = [
        'start_date' => QueryInterface::ORDER_ASCENDING,
    ];

    /**
     * @return QueryInterface<Event>
     */
    public function findUpcomingQuery(): QueryInterface
    {
        $query = $this->createQuery();
        $query->matching(
            $query->greaterThanOrEqual('start_date', new \DateTime('today'))
        );

        return $query;
    }

    /**
     * @return array<Event>
     */
    public function findUpcoming(int $limit = 100): array
    {
        $query = $this->findUpcomingQuery();
        $query->setLimit($limit);

        return $query->execute()->toArray();
    }
}
