(function(window, angular, undefined){
  'use strict';

  var module = angular.module('nsPopover', []);
  var $el = angular.element;
  var isDef = angular.isDefined;
  var forEach = angular.forEach;

  /**
   * Extends the destination objec 'dst' by copying all of the properties from the 'src' object(s)
   * to 'dst'. Multiple src objects could be specified. 'undefined' values are not copied.
   *
   * @param {Object} dst The destination object.
   * @param {Object} src The spurce object.
   * @returns {Object} Reference to 'dst'.
   */
  var extend_ = function extend(dst, src) {
    forEach(arguments, function(obj) {
      if (obj !== src) {
        forEach(obj, function(value, key) {
          if (isDef(value)) {
            dst[key] = value;
          }
        });
      }
    });
  };

  module.directive('nsPopover', function($timeout, $templateCache, $q, $http, $compile, $document) {
    return {
      restrict: 'A',
      link: function(scope, elm, attrs) {
        var options = {
          template: attrs.nsPopoverTemplate,
          theme: attrs.nsPopoverTheme || 'ns-popover-default-theme',
          plain: attrs.nsPopoverPlain,
          trigger: attrs.nsPopoverTrigger || 'click',
          container: attrs.nsPopoverContainer,
          placement: attrs.nsPopoverPlacement || 'bottom|left'
        };

        var timeoutId_ = {};

        var $container = $el(options.container);
        if (!$container.length) {
          $container = $document.find('body');
        }

        var $popover = $el('<div></div>');
        var placement_;
        var align_;

        var match = options.placement
          .match(/^(top|bottom|left|right)$|((top|bottom)\|(center|left|right)+)|((left|right)\|(center|top|bottom)+)/);

        if (!match) {
          throw new Error('"' + options.placement + '" is not a valid placement or has a invalid combination of placements.');
        }

        placement_ = match[6] || match[3] || match[1];
        align_ = match[8] | match[4] || match[2] || 'center';

        $q.when(loadTemplate(options.template, options.plain)).then(function(template) {
          template = angular.isString(template) ?
            template :
            template.data && angular.isString(template.data) ?
              template.data :
              '';

          $popover.html(template);

          if (options.theme) {
            $popover.addClass(options.theme);
          }

          $timeout(function() {
            $compile($popover)(scope);
          });

          scope.$on('$destroy', function() {
            $popover.remove();
          });

          $popover
            .css('position', 'absolute')
            .css('display', 'none');

          $container.append($popover);
        });

        elm.on(options.trigger, function(e) {
          e.preventDefault();

          $timeout.cancel(timeoutId_);

          $popover.css('display', 'block');

          // position the popover accordingly to the defined placement around the
          // |elm|.
          move($popover, placement_, align_, elm[0].getBoundingClientRect());

          // Hide the popover without delay on click events.
          $popover.on('click', function() {
            timeoutId_ = hide($popover, 0);
          });
        });

        elm.on('mouseout', function() {
          timeoutId_ = hide($popover);
        });

        $popover
          .on('mouseout', function(e) {
            timeoutId_ = hide($popover);
          })
          .on('mouseover', function() {
            $timeout.cancel(timeoutId_);
          });

        /**
         * Move the popover to the |placement| position of the object located on the |rect|.
         *
         * @param popover {Object} The popover object to be moved.
         * @param placement {String} The relative position to move the popover - top | bottom | left | right.
         * @param rect {ClientRect} The ClientRect of the object to move the popover around.
         */
        function move(popover, placement, align, rect) {
          var popoverRect = popover[0].getBoundingClientRect();
          var top, left;

          var positionX = function() {
            if (align === 'center') {
              return Math.round(rect.left + rect.width/2 - popoverRect.width/2);
            } else {
              return rect[align];
            }
          };

          var positionY = function() {
            if (align === 'center') {
              return Math.round(rect.top + rect.height/2 - popoverRect.height/2);
            } else {
              return rect[align];
            }
          };

          if (placement === 'top') {
            top = rect.top - popoverRect.height - 1;
            left = positionX();
          } else if (placement === 'right') {
            top = positionY();
            left = rect.right +1;
          } else if (placement === 'bottom') {
            top = rect.bottom + 1;
            left = positionX(align);
          } else if (placement === 'left') {
            top = positionY(align);
            left = rect.left - popoverRect.width - 1;
          }
          popover
            .css('top', top.toString() + 'px')
            .css('left', left.toString() + 'px');
        }

        /**
         * Set the display property of the popover to 'none' after |delay| milliseconds.
         *
         * @param popover {Object} The popover to set the display property.
         * @param delay {Number}  The time (in milliseconds) to wait before set the display property.
         * @returns {Object|promise} A promise returned from the $timeout service that can be used
         *                           to cancel the hiding operation.
         */
        function hide(popover, delay) {
          $timeout.cancel(timeoutId_);

          // delay the hiding operation for 1.5s by default.
          if (!isDef(delay)) {
            delay = 1500;
          }

          return $timeout(function() {
            popover.css('display', 'none');
          }, delay);
        }

        /**
         * Load the given template in the cache if it is not already loaded.
         *
         * @param template The URI of the template to be loaded.
         * @returns {String} A promise that the template will be loaded.
         * @remarks If the template is null or undefined a empty string will be returned.
         */
        function loadTemplate(template, plain) {
          if (!template) {
            return '';
          }

          if (angular.isString(template) && plain) {
            return template;
          }

          return $templateCache.get(template) || $http.get(template, { cache : true });
        }
      }
    };
  });
})(window, window.angular);