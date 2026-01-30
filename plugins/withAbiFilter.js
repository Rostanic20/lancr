const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withAbiFilter(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const idx = props.findIndex((p) => p.key === "reactNativeArchitectures");
    const entry = { type: "property", key: "reactNativeArchitectures", value: "arm64-v8a" };
    if (idx >= 0) {
      props[idx] = entry;
    } else {
      props.push(entry);
    }
    return config;
  });
};
