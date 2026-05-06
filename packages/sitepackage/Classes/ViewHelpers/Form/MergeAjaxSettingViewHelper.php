<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\ViewHelpers\Form;

use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Merges the useAjax FlexForm setting into a form definition array's
 * renderingOptions, so the Form.fluid.html template can read it.
 *
 * Usage in Fluid:
 *   {sitepackage:form.mergeAjaxSetting(configuration: formConfiguration, useAjax: settings.useAjax)}
 */
final class MergeAjaxSettingViewHelper extends AbstractViewHelper
{
    public function initializeArguments(): void
    {
        $this->registerArgument('configuration', 'array', 'The form definition array', true);
        $this->registerArgument('useAjax', 'mixed', 'The useAjax FlexForm value', false, false);
    }

    public function render(): array
    {
        $configuration = $this->arguments['configuration'];
        $useAjax = (bool) $this->arguments['useAjax'];

        if ($useAjax) {
            $configuration['renderingOptions']['useAjax'] = true;
        }

        return $configuration;
    }
}
