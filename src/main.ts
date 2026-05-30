import './style.css';
import './forms/forms.css';
import { initTypo3Forms } from 'formlayer/typo3'
import { registerAltchaPlugin } from 'formlayer-plugin-altcha';
import { registerDatepickerPlugin } from 'formlayer-plugin-datepicker';
import { registerClientVariantsPlugin } from 'formlayer-plugin-client-variants';
import { registerComboboxPlugin } from 'formlayer-plugin-combobox';

registerAltchaPlugin()
registerDatepickerPlugin()
registerClientVariantsPlugin()
registerComboboxPlugin()
registerDatepickerPlugin();


initTypo3Forms();

