import { device } from './device';
import { services } from './services';
import { agreements } from './agreements';
import { attributes } from './attributes';
import { accountFormFieldChange, accountFormMultiFieldChange, accountFormDataSubmit, accountFormPasswordReset } from './accountForm';
import { deviceFormFieldChange, deviceFormMultiFieldChange, deviceFormSubmit} from './deviceForm';
import { servicesFormFieldChange, servicesFormMultiFieldChange, servicesFormSubmit } from './servicesForm';

// public interface to actions
export {
  agreements,
  device,
  services,
  attributes,
  accountFormFieldChange,
  accountFormMultiFieldChange,
  accountFormDataSubmit,
  accountFormPasswordReset,
  deviceFormFieldChange,
  deviceFormMultiFieldChange,
  deviceFormSubmit,
  servicesFormFieldChange,
  servicesFormMultiFieldChange,
  servicesFormSubmit
};
