<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Form\Domain\Model\Renderable\AbstractRenderable;
use TYPO3\CMS\Form\Event\AfterCurrentPageIsResolvedEvent;

/**
 * Disables Altcha form elements when JavaScript is unavailable.
 *
 * Altcha requires client-side JS to solve the proof-of-work challenge.
 * Without JS the hidden input stays empty and AltchaValidator rejects
 * the submission with "This field is mandatory" — for a field the user
 * cannot see or interact with.
 *
 * The Altcha Fluid partial renders a <noscript> hidden input named
 * `__altcha_nojs`. When present in the POST body, this listener sets
 * `enabled: false` on every Altcha element so FormRuntime skips their
 * validators — the same mechanism ClientVariantsValidationListener uses.
 */
#[AsEventListener('t13forms/altcha-nojs-fallback')]
final class AltchaNoJsFallbackListener
{
    public function __invoke(AfterCurrentPageIsResolvedEvent $event): void
    {
        $formRuntime = $event->formRuntime;
        $formState = $formRuntime->getFormState();

        if ($formState === null || !$formState->isFormSubmitted()) {
            return;
        }

        if (!$this->isNoJsSubmission()) {
            return;
        }

        foreach ($formRuntime->getFormDefinition()->getPages() as $page) {
            foreach ($page->getElementsRecursively() as $element) {
                if (
                    $element instanceof AbstractRenderable
                    && $element->getType() === 'Altcha'
                ) {
                    $element->setRenderingOption('enabled', false);
                }
            }
        }
    }

    /**
     * The <noscript> block in Altcha.html adds a hidden `__altcha_nojs`
     * field that only reaches the server when JS is disabled.
     */
    private function isNoJsSubmission(): bool
    {
        $request = $GLOBALS['TYPO3_REQUEST'] ?? null;
        if ($request === null) {
            return false;
        }

        $body = $request->getParsedBody();
        return is_array($body) && ($body['__altcha_nojs'] ?? null) === '1';
    }
}
