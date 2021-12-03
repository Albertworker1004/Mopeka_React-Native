/**
 * @license
 * Mopeka Products, LLC ("COMPANY") CONFIDENTIAL
 * Unpublished Copyright (c) 2015-2017 Mopeka Products, LLC, All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains the property of COMPANY. The intellectual and technical concepts contained
 * herein are proprietary to COMPANY and may be covered by U.S. and Foreign Patents, patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is strictly forbidden unless prior written permission is obtained
 * from COMPANY. Access to the source code contained herein is hereby forbidden to anyone except current COMPANY employees, managers or contractors who have executed
 * Confidentiality and Non-disclosure agreements explicitly covering such access.
 *
 * The copyright notice above does not evidence any actual or intended publication or disclosure of this source code, which includes
 * information that is confidential and/or proprietary, and is a trade secret, of COMPANY.  ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC PERFORMANCE,
 * OR PUBLIC DISPLAY OF OR THROUGH USE OF THIS SOURCE CODE WITHOUT THE EXPRESS WRITTEN CONSENT OF COMPANY IS STRICTLY PROHIBITED, AND IN VIOLATION OF APPLICABLE
 * LAWS AND INTERNATIONAL TREATIES. THE RECEIPT OR POSSESSION OF THIS SOURCE CODE AND/OR RELATED INFORMATION DOES NOT CONVEY OR IMPLY ANY RIGHTS
 * TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT MAY DESCRIBE, IN WHOLE OR IN PART.
 */

/*jshint
    sub: true
*/

import $$ from 'jquery'
import { utils } from './utils'

// let $$ = $;

export namespace dfp {
  let ads = {}
  const fadeSpeed = 1000
  let googletag = window['googletag']
  googletag = googletag || {}
  googletag.cmd = googletag.cmd || []

  // Intercept all clicks
  //$$(document).on('click', 'a[href^="http"]', intercept_clicks);

  push(function () {
    let prep_slot = (ad_name: string, sizes: number[][]) => {
      let s = googletag.defineSlot('/187340047/' + ad_name, sizes, ad_name)
      s.addService(googletag.pubads())
      s.setCollapseEmptyDiv(true, true)
      ads[ad_name] = s
      utils.log('Adding ad=' + ad_name)
    }

    prep_slot('tc_info_bottom', [[300, 100]])
    prep_slot('tc_main_bottom', [[300, 100]])
    prep_slot('tc_info_low_level', [[300, 100]])

    googletag.setAdIframeTitle('google_ad')
    googletag.disablePublisherConsole()
    googletag.pubads().enableSingleRequest()
    googletag.pubads().disableInitialLoad()
    googletag.pubads().setTargeting('AppVersion', '<!--VERSION-->')
    googletag.pubads().addEventListener('slotRenderEnded', slotRenderEnded)
    googletag.pubads().addEventListener('slotOnload', slotOnload)

    googletag.enableServices()
  })

  push(() => {
    googletag.display('tc_info_bottom')
  })
  push(() => {
    googletag.display('tc_main_bottom')
  })
  push(() => {
    googletag.display('tc_info_low_level')
  })

  function push(fn: Function) {
    //utils.log("Pushing fn=" + fn);
    googletag.cmd.push(fn)
  }

  export function hideAd(ad_name: string, force: boolean) {
    $$('#' + ad_name + '_parent')
      .stop()
      .fadeOut(force ? 0 : fadeSpeed)
  }

  export function showAd(ad_name: string) {
    $$('#' + ad_name + '_parent')
      .stop()
      .fadeIn(fadeSpeed)
  }

  export function clearAd(ad_name: string) {
    let a = ads[ad_name]
    if (!a) return

    a.isLoaded = false
    a.isPrepared = false
    hideAd(ad_name, true)
  }

  export function refreshAd(ad_name, tags) {
    let a = ads[ad_name]
    if (!a) return

    if (!a.isPrepared) {
      a.isPrepared = true
      utils.log('doing refresh')

      push(() => {
        let a = ads[ad_name]
        if (!tags || tags === '') {
          a.setTargeting('SensorTags', 'none')
        } else {
          a.setTargeting('SensorTags', tags.split(','))
        }
        googletag.pubads().refresh([a])
      })
    } else if (a.isLoaded) {
      showAd(ad_name)
    }
  }

  function slotOnload(event) {
    let slot = event.slot
    let id = slot.getSlotElementId()
    utils.log('adLoaded ' + id)
  }

  function slotRenderEnded(event) {
    let slot = event.slot
    let id = slot.getSlotElementId()
    utils.log('slotRenderEnded ' + id)
    if (event.isEmpty) {
      hideAd(id, true)
    } else {
      ads[id].isLoaded = true
      showAd(id)
    }

    //hookIframes(id);
  }

  /*
    function hookIframes(id : number)
    {
        $$("#" + id + " iframe[title=google_ad]").each(function (_f) {
            let t = $$(this);
            t.contents().off('click', 'a[href^="http"]', intercept_clicks);
            t.contents().on('click', 'a[href^="http"]', intercept_clicks);
            utils.log('hooked iframe: ' + t.attr('id'));
        });
    }*/

  /*
    function intercept_clicks(e : any)
    {
        var url = $$(e.currentTarget).attr('href');

        var ref = cordova['ThemeableBrowser'].open(url, "_blank", {
            toolbar: {
                height: 42,
                color: '#e9e9e9ff'
            },
            title: {
                color: '#333333ff',
                showPageTitle: true
            },
            backButton: {
                image: 'back',
                imagePressed: 'back_pressed',
                align: 'left',
                event: 'backPressed'
            },

            disableAnimation: true,
            backButtonCanClose: true
        });

        ref.addEventListener('backPressed', function() {
            if (ref !== undefined) {
                ref.close();
                ref = undefined;
            }
        });

        e.preventDefault();
    }*/
}
