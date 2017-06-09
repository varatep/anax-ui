// TODO: clean up compatibility-driven mess

function computeAttrs(label, ram, cpus = 1) {
  return {
    id: 'compute',
    short_type: 'compute',
    label: label,
    publishable: true,
    mappings: {
      ram: ram,
      cpus: cpus // to be removed in future versions,
    }
  };
}

export function purpleairService(deviceHostname, ram) {
  return {
    sensor_url: 'https://bluehorizon.network/documentation/airpollution-device-api',
    sensor_name: 'airpollution',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
          MTN_PURPLE_AIR_SENSOR_NAME: deviceHostname,
          HZN_PURPLE_AIR_SENSOR_NAME: deviceHostname
        }
      },
      {...computeAttrs('PurpleAir (air pollution sensing)', ram)}
    ]
  };
}

// this is a compatibility thing
export function locationService(usegps, ram) {
  const obj = {
    sensor_url: 'https://bluehorizon.network/documentation/location-device-api',
    sensor_name: 'location',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
        }
      },
      {...computeAttrs('Device location', ram)}
    ]
  };

  // compatibility: this envvar needs to be set only if the usegps is true and the value doesn't matter, the envvar is merely tested for existence
  if (usegps) {
    obj.attributes[0].mappings['MTN_GPSDEVICE'] = 'true';
    obj.attributes[0].mappings['HZN_GPSDEVICE'] = 'true';
  }

  return obj;
}

export function cputempService(ram) {
  return {
    sensor_url: 'https://bluehorizon.network/documentation/cputemp-device-api',
    sensor_name: 'cputemp',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
          MTN_CPU_TEMP: 'true',
          HZN_CPU_TEMP: 'true'
        }
      },
      {...computeAttrs('CPU temperature', ram)}
    ]
  };
}

export function citygramService(description, email, name, password, ram) {
  return {
    sensor_url: 'https://bluehorizon.network/documentation/citygram-device-api',
    sensor_name: 'citygram',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
        }
      },
      {
        id: 'private_data',
        short_type: 'mapped',
        label: 'private_data',
        publishable: false,
        mappings: {
          MTN_CG_EMAIL: email,
          MTN_CG_PASS: password,
          MTN_CG_NAME: name,
          MTN_CG_RSDDESC: description,
          HZN_CG_EMAIL: email,
          HZN_CG_PASS: password,
          HZN_CG_NAME: name,
          HZN_CG_RSDDESC: description
        }
      },
      {...computeAttrs('NYU Citygram (noise pollution analysis)', ram)}
    ]
  };
}

export function pwsService(wugname, model, type, ram) {
  return {
    sensor_url: 'https://bluehorizon.network/documentation/pws-device-api',
    sensor_name: 'pws',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
          MTN_WUGNAME: wugname,
          MTN_PWS_MODEL: model,
          MTN_PWS_ST_TYPE: type,
          HZN_WUGNAME: wugname,
          HZN_PWS_MODEL: model,
          HZN_PWS_ST_TYPE: type
        }
      },
      {...computeAttrs('Personal Weather Station', ram)}
    ]
  };
}

export function netspeedService(targetServer, ram) {
  return {
    sensor_url: 'https://bluehorizon.network/documentation/netspeed-device-api',
    sensor_name: 'netspeed',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
          MTN_TARGET_SERVER: targetServer,
          HZN_TARGET_SERVER: targetServer
        }
      },
      {...computeAttrs('Netspeed (network quality testing)', ram)}
    ]
  };
}

export function sdrService(ram) {
  return {
    sensor_url: 'https://bluehorizon.network/documentation/sdr-device-api',
    sensor_name: 'sdr',
    attributes: [
      {
        id: 'app - compat',
        short_type: 'mapped',
        label: 'app - compat',
        publishable: true,
        mappings: {
        }
      },
      {...computeAttrs('Software Defined Radio', ram)}
    ]
  };
}
