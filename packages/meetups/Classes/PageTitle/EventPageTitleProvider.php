<?php

declare(strict_types=1);

namespace T13\Meetups\PageTitle;

use Psr\Http\Message\ServerRequestInterface;
use T13\Meetups\Domain\Model\Event;
use T13\Meetups\Domain\Repository\EventRepository;
use TYPO3\CMS\Core\PageTitle\PageTitleProviderInterface;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Mvc\RequestInterface;

/**
 * Sets the browser/page title to the event title when the Meetups plugin
 * renders the Event::show action.
 */
class EventPageTitleProvider implements PageTitleProviderInterface
{
    private ServerRequestInterface $request;

    public function __construct(
        private readonly EventRepository $eventRepository,
    ) {}

    public function setRequest(ServerRequestInterface $request): void
    {
        $this->request = $request;
    }

    public function getTitle(): string
    {
        if (!$this->isMeetupsShowAction($this->request)) {
            return '';
        }

        $eventUid = $this->resolveEventUid($this->request);
        if ($eventUid === null) {
            return '';
        }

        $event = $this->eventRepository->findByUid($eventUid);
        if (!$event instanceof Event) {
            return '';
        }

        return $event->getTitle();
    }

    private function isMeetupsShowAction(ServerRequestInterface $request): bool
    {
        $pluginParams = $this->getPluginParameters($request);

        return ($pluginParams['controller'] ?? '') === 'Event'
            && ($pluginParams['action'] ?? '') === 'show';
    }

    private function resolveEventUid(ServerRequestInterface $request): ?int
    {
        $pluginParams = $this->getPluginParameters($request);
        $event = $pluginParams['event'] ?? null;

        if (is_array($event) && isset($event['uid'])) {
            return (int) $event['uid'];
        }

        if (is_numeric($event)) {
            return (int) $event;
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function getPluginParameters(ServerRequestInterface $request): array
    {
        $params = array_merge(
            $request->getQueryParams()['tx_meetups_event'] ?? [],
            $request->getParsedBody()['tx_meetups_event'] ?? [],
        );

        return $params;
    }
}
