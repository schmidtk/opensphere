goog.module('os.annotation.FeatureAnnotation');
goog.module.declareLegacyNamespace();

goog.require('os.annotation.FeatureAnnotationUI');

const OverlayPositioning = goog.require('ol.OverlayPositioning');
const {listen, unlisten} = goog.require('ol.events');
const OLEventType = goog.require('ol.events.EventType');
const SimpleGeometry = goog.require('ol.geom.SimpleGeometry');
const {OPTIONS_FIELD} = goog.require('os.annotation');
const AbstractAnnotation = goog.require('os.annotation.AbstractAnnotation');
const ui = goog.require('os.ui');
const WebGLOverlay = goog.require('os.webgl.WebGLOverlay');

const Feature = goog.requireType('ol.Feature');


/**
 * An annotation tied to an OpenLayers feature.
 */
class FeatureAnnotation extends AbstractAnnotation {
  /**
   * Constructor.
   * @param {!Feature} feature The OpenLayers feature.
   */
  constructor(feature) {
    super();

    /**
     * The overlay.
     * @type {WebGLOverlay}
     * @protected
     */
    this.overlay = null;

    /**
     * The OpenLayers feature.
     * @type {!Feature}
     * @protected
     */
    this.feature = feature;

    listen(this.feature, OLEventType.CHANGE, this.handleFeatureChange, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    unlisten(this.feature, OLEventType.CHANGE, this.handleFeatureChange, this);
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    return /** @type {osx.annotation.Options|undefined} */ (this.feature.get(OPTIONS_FIELD));
  }

  /**
   * @inheritDoc
   */
  setOptions(options) {
    this.feature.set(OPTIONS_FIELD, options);
  }

  /**
   * @inheritDoc
   */
  setVisibleInternal() {
    if (this.overlay && this.feature) {
      var options = this.getOptions();
      if (options) {
        // Only show when both the feature and the annotation config flags are true.
        // Note: the overlay position is the only good way to control the visibility externally. If you try to call
        // the protected setVisible function on the overlay, much pain will be in your future.
        var showOverlay = this.visible && options.show;
        var position = options.position;
        this.overlay.setPosition(showOverlay ? position : null);
      }
    }
  }

  /**
   * @inheritDoc
   */
  createUI() {
    var options = this.getOptions();

    if (this.overlay || !options) {
      // don't create the overlay if it already exists or options are missing
      return;
    }

    if (!options.position) {
      var geometry = this.feature.getGeometry();
      var coordinate = geometry instanceof SimpleGeometry ? geometry.getFirstCoordinate() : undefined;
      options.position = coordinate;
    }

    // don't initialize with a position value as this seems to cause the overlay to jiggle on show/hide
    this.overlay = new WebGLOverlay({
      id: ol.getUid(this.feature),
      offset: options.offset,
      positioning: OverlayPositioning.CENTER_CENTER
    });

    // create an Angular scope for the annotation UI
    var compile = /** @type {!angular.$compile} */ (ui.injector.get('$compile'));
    this.scope = /** @type {!angular.Scope} */ (ui.injector.get('$rootScope').$new());

    Object.assign(this.scope, {
      'feature': this.feature,
      'overlay': this.overlay
    });

    // compile the template and assign the element to the overlay
    var template = '<featureannotation feature="feature" overlay="overlay"></featureannotation>';
    this.element = /** @type {Element} */ (compile(template)(this.scope)[0]);
    this.overlay.setElement(this.element);

    // add the overlay to the map
    var map = os.MapContainer.getInstance().getMap();
    if (map) {
      map.addOverlay(this.overlay);
    }

    this.setVisibleInternal();
  }

  /**
   * @inheritDoc
   */
  disposeUI() {
    if (this.overlay) {
      // remove the overlay from the map
      var map = os.MapContainer.getInstance().getMap();
      if (map) {
        map.removeOverlay(this.overlay);
      }

      // dispose of the overlay
      this.overlay.dispose();
      this.overlay = null;
    }

    // destroy the scope
    if (this.scope) {
      this.scope.$destroy();
      this.scope = null;
    }

    this.element = null;
  }

  /**
   * Update the annotation when the feature changes.
   *
   * @protected
   */
  handleFeatureChange() {
    this.setVisibleInternal();
  }
}

exports = FeatureAnnotation;
