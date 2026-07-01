<?php

declare(strict_types=1);

namespace T13\Meetups\Domain\Model;

use TYPO3\CMS\Extbase\DomainObject\AbstractEntity;

class Event extends AbstractEntity
{
    protected string $title = '';
    protected string $description = '';
    protected ?\DateTime $startDate = null;
    protected ?\DateTime $endDate = null;
    protected string $location = '';
    protected ?int $maxParticipants = null;
    protected bool $canceled = false;

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = $title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): void
    {
        $this->description = $description;
    }

    public function getStartDate(): ?\DateTime
    {
        return $this->startDate;
    }

    public function setStartDate(?\DateTime $startDate): void
    {
        $this->startDate = $startDate;
    }

    public function getEndDate(): ?\DateTime
    {
        return $this->endDate;
    }

    public function setEndDate(?\DateTime $endDate): void
    {
        $this->endDate = $endDate;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function setLocation(string $location): void
    {
        $this->location = $location;
    }

    public function getMaxParticipants(): ?int
    {
        return $this->maxParticipants;
    }

    public function setMaxParticipants(?int $maxParticipants): void
    {
        $this->maxParticipants = $maxParticipants;
    }

    public function isCanceled(): bool
    {
        return $this->canceled;
    }

    public function setCanceled(bool $canceled): void
    {
        $this->canceled = $canceled;
    }

    /**
     * Convenience getter used by Fluid and indexers.
     */
    public function getFormattedDateRange(): string
    {
        if ($this->startDate === null) {
            return '';
        }

        $format = 'j. F Y H:i';
        $start = $this->startDate->format($format);

        if ($this->endDate === null) {
            return $start;
        }

        return $start . ' – ' . $this->endDate->format($format);
    }
}
