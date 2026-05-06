<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\ViewHelpers\Form;

use TYPO3\CMS\Form\Domain\Model\FormElements\FormElementInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Serializes the clientVariants property of a form element into a JSON string
 * suitable for the data-client-variants attribute. This bridges server-side
 * condition definitions (YAML) to the client-side TypeScript evaluation layer.
 *
 * Usage in Fluid:
 *   <div data-client-variants="{sitepackage:form.clientVariantsData(element: element)}">
 *
 * Returns an empty string if the element has no clientVariants defined.
 */
final class ClientVariantsDataViewHelper extends AbstractViewHelper
{
    public function initializeArguments(): void
    {
        $this->registerArgument('element', FormElementInterface::class, 'The form element to read clientVariants from', true);
    }

    public function render(): string
    {
        /** @var FormElementInterface $element */
        $element = $this->arguments['element'];
        $properties = $element->getProperties();
        $clientVariants = $properties['clientVariants'] ?? null;

        if (!is_array($clientVariants) || $clientVariants === []) {
            return '';
        }

        return json_encode($clientVariants, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }
}
