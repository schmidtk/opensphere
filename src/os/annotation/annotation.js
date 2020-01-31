goog.module('os.annotation');
goog.module.declareLegacyNamespace();

const GeometryType = goog.require('ol.geom.GeometryType');
const {getUid} = goog.require('ol');
const Point = goog.require('ol.geom.Point');
const TailStyle = goog.require('os.annotation.TailStyle');
const {measureText} = goog.require('os.ui');
const FeatureEditCtrl = goog.require('os.ui.FeatureEditCtrl');

const Feature = goog.requireType('ol.Feature');
const Overlay = goog.requireType('ol.Overlay');


/**
 * Default annotation options.
 * @type {osx.annotation.Options}
 * @const
 */
exports.DEFAULT_OPTIONS = {
  editable: true,
  show: true,
  showBackground: true,
  showName: true,
  showDescription: true,
  showTail: TailStyle.DEFAULT,
  size: [200, 100],
  offset: [0, -75],
  headerBG: undefined,
  bodyBG: undefined
};


/**
 * Maximum annotation height when computing size from text.
 * @type {number}
 * @const
 */
exports.MAX_DEFAULT_HEIGHT = 350;


/**
 * Maximum annotation width when computing size from text.
 *
 * This size must correspond to the `max-width` in `.u-annotation__measure` for accurate size calculation.
 *
 * @type {number}
 * @const
 */
exports.MAX_DEFAULT_WIDTH = 350;


/**
 * Height of an annotation being edited inline.
 *
 * @type {number}
 * @const
 */
exports.EDIT_HEIGHT = 270;


/**
 * Width of an annotation being edited inline.
 *
 * @type {number}
 * @const
 */
exports.EDIT_WIDTH = 570;


/**
 * Annotation event types.
 * @enum {string}
 */
exports.EventType = {
  CHANGE: 'annotation:change',
  EDIT: 'annotation:edit',
  HIDE: 'annotation:hide',
  LAUNCH_EDIT: 'annotation:launchEdit',
  UPDATE_PLACEMARK: 'annotation:updatePlacemark'
};


/**
 * Feature field for storing annotation options.
 * @type {string}
 * @const
 */
exports.OPTIONS_FIELD = '_annotationOptions';


/**
 * Generate annotation options to display the given text.
 *
 * @param {osx.annotation.Options} options The options.
 * @param {string} text The annotation text.
 */
exports.scaleToText = function(options, text) {
  // compute the annotation size from the text. the height/width must include the text size, plus the header/padding.
  var size = measureText(text, 'u-annotation__measure');

  var annotationHeight = size.height + 10 + (options.showName ? 25 : 0);
  annotationHeight = Math.min(annotationHeight, exports.MAX_DEFAULT_HEIGHT);

  var annotationWidth = Math.min(size.width + 10, exports.MAX_DEFAULT_WIDTH);
  options.size = [annotationWidth, annotationHeight];

  // display the annotation 25px above the target
  options.offset[1] = -(annotationHeight / 2) - 25;
};


/**
 * Get the name text for an annotation balloon.
 *
 * @param {Feature} feature The feature.
 * @return {string} The text.
 */
exports.getNameText = function(feature) {
  if (feature) {
    return /** @type {string|undefined} */ (feature.get(FeatureEditCtrl.Field.NAME)) || '';
  }

  return '';
};


/**
 * Get the description text for an annotation balloon.
 *
 * @param {Feature} feature The feature.
 * @return {string} The text.
 */
exports.getDescriptionText = function(feature) {
  if (feature) {
    return /** @type {string|undefined} */ (feature.get(FeatureEditCtrl.Field.MD_DESCRIPTION))
        || /** @type {string|undefined} */ (feature.get(FeatureEditCtrl.Field.DESCRIPTION)) || '';
  }

  return '';
};


/**
 * If a feature has a map overlay present.
 *
 * @param {Feature} feature The feature.
 * @return {boolean}
 */
exports.hasOverlay = function(feature) {
  if (feature) {
    var map = os.MapContainer.getInstance().getMap();
    if (map) {
      return !!map.getOverlayById(getUid(feature));
    }
  }

  return false;
};


/**
 * Set the target map position for an overlay.
 *
 * @param {!Overlay} overlay The overlay.
 * @param {Feature} feature The feature. Use null to hide the overlay.
 */
exports.setPosition = function(overlay, feature) {
  var position;

  if (feature) {
    var geometry = feature.getGeometry();
    if (geometry && geometry.getType() === GeometryType.POINT) {
      // nothing fancy for points, just use the coordinate
      position = /** @type {Point} */ (geometry).getFirstCoordinate();
    } else {
      var map = overlay.getMap();
      var element = overlay.getElement();

      if (map && element) {
        var mapRect = exports.getMapRect(overlay);
        var cardRect = element.getBoundingClientRect();
        cardRect.x -= mapRect.x;
        cardRect.y -= mapRect.y;

        var cardCenter = [cardRect.x + cardRect.width / 2, cardRect.y + cardRect.height / 2];
        var coordinate = map.getCoordinateFromPixel(cardCenter);

        if (!coordinate) {
          // TODO: when the card is off the edge of the map/globe, the nearestPoints method from JSTS blows up.
          // Fixing this correctly will require reimplementing the method to work in screen space. Instead, just
          // stop updating the anchor point until the annotation is back over the map.
          return;
        }

        var cardGeometry = new Point(coordinate);

        if (cardGeometry && geometry) {
          var coords = os.geo.jsts.nearestPoints(cardGeometry, geometry);
          position = coords[1];
        }
      }
    }
  }

  overlay.setPosition(position);
};


/**
 * Get the OpenLayers map bounding rectangle.
 *
 * @param {Overlay} overlay The overlay to get the map rectangle from.
 * @return {ClientRect|undefined} The map bounding rectangle, or undefined if the map/overlay are not defined.
 */
exports.getMapRect = function(overlay) {
  if (overlay) {
    var map = overlay.getMap();
    if (map) {
      var mapEl = map.getTargetElement();
      if (mapEl) {
        return mapEl.getBoundingClientRect();
      }
    }
  }

  return undefined;
};
