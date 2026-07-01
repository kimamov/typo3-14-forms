import './style.css';
import 'formlayer/forms.css';
import { initTypo3Forms } from 'formlayer/typo3'
import { registerTypo3AltchaPlugin } from 'formlayer-plugin-altcha/typo3';
import { registerDatepickerPlugin } from 'formlayer-plugin-datepicker';
import { registerClientVariantsPlugin } from 'formlayer-plugin-client-variants';
import { registerComboboxPlugin } from 'formlayer-plugin-combobox';

registerTypo3AltchaPlugin()
registerDatepickerPlugin()
registerClientVariantsPlugin()
registerComboboxPlugin()


initTypo3Forms();

