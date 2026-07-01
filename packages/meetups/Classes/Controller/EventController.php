<?php

declare(strict_types=1);

namespace T13\Meetups\Controller;

use Psr\Http\Message\ResponseInterface;
use T13\Meetups\Domain\Model\Event;
use T13\Meetups\Domain\Repository\EventRepository;
use TYPO3\CMS\Extbase\Http\ForwardResponse;
use TYPO3\CMS\Extbase\Mvc\Controller\ActionController;
use TYPO3\CMS\Extbase\Pagination\QueryResultPaginator;
use TYPO3\CMS\Extbase\Property\TypeConverter\DateTimeConverter;
use TYPO3\CMS\Extbase\Utility\LocalizationUtility;

class EventController extends ActionController
{
    public function __construct(
        private readonly EventRepository $eventRepository,
    ) {}

    public function listAction(int $currentPage = 1): ResponseInterface
    {
        $itemsPerPage = max(1, (int)($this->settings['list']['itemsPerPage'] ?? 10));

        $query = $this->eventRepository->findUpcomingQuery();
        $paginator = new QueryResultPaginator($query->execute(), $currentPage, $itemsPerPage);

        $currentPage = $paginator->getCurrentPageNumber();
        $numberOfPages = $paginator->getNumberOfPages();

        $this->view->assignMultiple([
            'events' => $paginator->getPaginatedItems(),
            'paginator' => $paginator,
            'pagination' => [
                'currentPage' => $currentPage,
                'numberOfPages' => $numberOfPages,
                'hasMorePages' => $currentPage < $numberOfPages,
                'hasPreviousPages' => $currentPage > 1,
                'previousPage' => $currentPage > 1 ? $currentPage - 1 : null,
                'nextPage' => $currentPage < $numberOfPages ? $currentPage + 1 : null,
            ],
        ]);

        return $this->htmlResponse();
    }

    public function showAction(Event $event): ResponseInterface
    {
        $this->view->assign('event', $event);

        return $this->htmlResponse();
    }

    public function newAction(): ResponseInterface
    {
        $this->view->assign('event', new Event());

        return $this->htmlResponse();
    }

    public function initializeCreateAction(): void
    {
        $dateTimeFormat = 'Y-m-d\\TH:i';
        $propertyMappingConfiguration = $this->arguments['event']->getPropertyMappingConfiguration();
        $propertyMappingConfiguration->forProperty('startDate')->setTypeConverterOption(
            DateTimeConverter::class,
            DateTimeConverter::CONFIGURATION_DATE_FORMAT,
            $dateTimeFormat
        );
        $propertyMappingConfiguration->forProperty('endDate')->setTypeConverterOption(
            DateTimeConverter::class,
            DateTimeConverter::CONFIGURATION_DATE_FORMAT,
            $dateTimeFormat
        );
    }

    public function createAction(Event $event): ResponseInterface
    {
        if (!$this->isValidEvent($event)) {
            $this->addFlashMessage(
                LocalizationUtility::translate('event.error.invalid', 'Meetups') ?? 'Please check your input.',
                '',
                \TYPO3\CMS\Core\Type\ContextualFeedbackSeverity::ERROR
            );
            return new ForwardResponse('new');
        }

        $this->eventRepository->add($event);
        $this->addFlashMessage(
            LocalizationUtility::translate('event.created', 'Meetups') ?? 'The event has been created.'
        );

        return $this->redirect('list');
    }

    private function isValidEvent(Event $event): bool
    {
        return $event->getTitle() !== ''
            && $event->getStartDate() !== null
            && $event->getLocation() !== '';
    }
}
