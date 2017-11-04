import { device } from './device';
import { services, microservices, workloads } from './services';
import { agreements } from './agreements';
import { attributes } from './attributes';
import { configuration } from './configuration';
import { accountFormFieldChange, accountFormMultiFieldChange, accountFormDataSubmit, accountFormPasswordReset, setExpectExistingAccount } from './accountForm';
import { deviceFormFieldChange, deviceFormMultiFieldChange, deviceFormSubmit, deviceFormSubmitBlockchain } from './deviceForm';
import { servicesFormFieldChange, servicesFormMultiFieldChange, servicesFormSubmit } from './servicesForm';
import { patterns } from './patterns';

// public interface to actions
export {
  agreements,
  device,
  services,
  microservices,
  workloads,
  attributes,
  configuration,
  accountFormFieldChange,
  accountFormMultiFieldChange,
  accountFormDataSubmit,
  accountFormPasswordReset,
  setExpectExistingAccount,
  deviceFormFieldChange,
  deviceFormMultiFieldChange,
  deviceFormSubmit,
  deviceFormSubmitBlockchain,
  servicesFormFieldChange,
  servicesFormMultiFieldChange,
  servicesFormSubmit,
  patterns,
};
