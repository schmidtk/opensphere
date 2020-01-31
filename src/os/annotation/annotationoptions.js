goog.module('os.annotation.annotationOptionsDirective');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');


/**
 * An annotation to attach to the map.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/annotation/annotationoptions.html'
  };
};


/**
 * Add the directive to the module
 */
Module.directive('annotationoptions', [directive]);
exports = directive;
