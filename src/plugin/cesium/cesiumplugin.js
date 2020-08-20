goog.provide('plugin.cesium.Plugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.cesium.CesiumRenderer');


/**
 * Provides a WebGL renderer for the map, powered by Cesium.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cesium.Plugin = function() {
  plugin.cesium.Plugin.base(this, 'constructor');
  this.id = plugin.cesium.Plugin.ID;
};
goog.inherits(plugin.cesium.Plugin, os.plugin.AbstractPlugin);


/**
 * The plugin identifier.
 * @type {string}
 * @const
 */
plugin.cesium.Plugin.ID = 'cesium';


/**
 * @inheritDoc
 */
plugin.cesium.Plugin.prototype.init = function() {
  // update the Ion service URL from settings. this should be done first, as it impacts if Ion-related features are
  // loaded in the application.
  plugin.cesium.ionUrl = /** @type {string} */ (os.settings.get(plugin.cesium.SettingsKey.ION_URL,
      plugin.cesium.DEFAULT_ION_URL));

  // register 3D tiles layers
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.cesium.tiles.ID, plugin.cesium.tiles.LayerConfig);

  var dm = os.dataManager;
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.cesium.tiles.ID,
      plugin.cesium.tiles.Provider,
      plugin.cesium.tiles.TYPE,
      plugin.cesium.tiles.TYPE));
  dm.registerDescriptorType(plugin.cesium.tiles.ID, plugin.cesium.tiles.Descriptor);

  // add 3D layer group
  var group = new os.layer.Group();
  group.setPriority(3);
  group.setOSType(plugin.cesium.CESIUM_ONLY_LAYER);
  group.setCheckFunc(function(layer) {
    if (os.implements(layer, os.layer.ILayer.ID)) {
      return /** @type {os.layer.ILayer} */ (layer).getOSType() === plugin.cesium.CESIUM_ONLY_LAYER;
    }
    return false;
  });

  os.map.mapContainer.addGroup(group);

  // check if cesium is the active renderer
  if (os.settings.get(os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY) == plugin.cesium.Plugin.ID) {
    os.MapContainer.getInstance().setWebGLRenderer(new plugin.cesium.CesiumRenderer());
  } else {
    os.MapContainer.getInstance().addWebGLRenderer(new plugin.cesium.CesiumRenderer());
  }
};
