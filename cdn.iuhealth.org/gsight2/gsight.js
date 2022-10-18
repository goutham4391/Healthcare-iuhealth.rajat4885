(function () {
    /**
     * Start Configuration
     */
    var baseUrl = "https://cdn.iuhealth.org/gsight2";
    var config = {
        baseUrl: baseUrl,
        //
        // Your client id in the gsight database.  This should be given to you or pre-populated.
        //
        clientId: "5868d358-92bc-4f5b-b9ad-0b2d47e8ba36",
        //
        // The url to the gsight api.  This shouldnt need to change in most cases.
        //
        gsightApiUrl: "https://portal.gsight.net",
        chaosDelay: 500,
        logoUrl: baseUrl + "/img/logo.svg",
        logoAlt: "Client Logo",
        logoWidth: "200px",
        //
        // If true, the invite will not load on its own, but rather must be triggered manually by a function call
        //
        manualTrigger: false,
        //
        // runMode: Possible values: invite, survey.
        // If value is invite, calling the function to manually launch gsight will trigger the invite.
        // If value is survey, it will trigger the survey popup.
        //
        runMode: "invite",
        //
        // Set to true to auto load css/invite.css and css/client-styles.css.
        // If you need to load them somewhere other than where it is loaded in head,
        // set this to false and you can add the <link ... /> tags to your
        // layout/design yourself.  If this field is not defined, the default is true.
        //
        autoLoadCss: true,
        //
        // Set to true to use any existing jQuery that has been loaded.
        // Set to false to load a new jquery in no conflict mode if one is already loaded.
        //
        useExistingJQuery: false,
        invite: {
            // Every user will have a X percent chance to see the invite
            samplingPercentage: 35,
            // At least X seconds will pass before the invite dialog is triggered
            popupDelayInSeconds: 30,
            //
            // The file name in templates minus the extension.
            // Ex) if you have myTemplate.html in the templates folder, the value for this setting
            // should be "myTemplate"
            //
            template: "invite",
            header: "Welcome!",
            content: "<p>Your opinion about this website is important to us.  After your visit, would you be willing to answer a few questions to help us evaluate and improve our website? If you agree to take the survey, it will pop-up when you leave the website.</p>",
            nowButton: "Yes, after I leave the website",
            laterViaReminderButton: "Yes, later via text or email",
            neverButton: "Never",
            //
            // If the is true, the close button on the top right of the invite dialog is the same as never.
            // If false, it will allow the invite to close without setting the "never" cookie.
            //
            treatInviteCloseAsNever: true,
            // A cookie will be added so that this user wont see the
            // invite for X days
            daysToWait: {
                // When the user clicks "Never"
                never: 365,
                // When the user clicks "Yes, Now" or "Later, via text"
                yes: 365
            },
            //
            // Use this to set ip address ranges where the invite popup should not display.
            // ex) ipFilters: ["192.168.1.0/24"] will block 192.168.1.0 - 192.168.1.255
            // https://www.ipaddressguide.com/cidr
            //
            ipFilters: [],
            //
            // Populate this array of strings with full urls (including the domain, but minus the protocol) where the invite should not
            // display. ex) microsoft.com/my/page
            //
            pageBlacklist: []
        },
        survey: {
            header: "<h3 style='text-decoration:underline;margin-bottom:5px;'>Do Not Close This Window!</h3><p style='margin-top: 0px'>Please minimize this window.</p>",
            content: "<p>Return to this window to provide your feedback.  The survey will become available here after a moment.  You can continue browsing our website by selecting the main window.</p><p>Thanks again for your help!</p>",
            width: 800,
            height: 600
        },
        later: {
            template: "later",
            header: "Contact Information",
            content: "<p>Please fill out the form below so we can send you the survey.</p>",
            thankYouMessage: "<p>The survey link has been sent to the contact information you provided.</p>",
            sendButton: "Send me the survey",
            cancelButton: "Cancel",
            thankYouDoneButton: "Done",
            needSmsDomain: false
        }
    };
    /**
     * End Configuration - Do not change below this line unless you know what you are doing,
     * or have been instructed to do so.
     */

    // Create namespace on global window object for exposed gsight functionality
    window.gsight = window.gsight || {};

    if (config.manualTrigger) {
        console.log("GSight: Manual trigger detected. Setting up public api.");

        /**
         * The client might not be ready yet when an exposed method is called. Check if it exists.
         * If it doesnt, wait for a time and check again. When it does, trigger the callback with the client instance.
         */
        function getClient(onClientReady) {
            if (!window.gsight.client) {
                console.log("GSight: Client not loaded, waiting and checking again...");
                setTimeout(function () {
                    getClient(onClientReady);
                }, 500);
            } else {
                console.log("GSight: Client ready");
                onClientReady(window.gsight.client);
            }
        }

        /**
         * Get an instance of the gsight client.
         * @param {any} onClientReady A callback with one parameter: client - The instance of the WebsiteClient
         */
        window.gsight.getClient = function (onClientReady) {
            getClient(onClientReady);
        }

        /**
         * Calling this will trigger either the invite popup or the survey popup based on the config setting "runMode"
         * @param {any} onLaunched A callback with no parameters that is called when the invite is launched. Gives website a chance
         * to display / hide some sort of loading indicator if needed.
         */
        window.gsight.run = function (onLaunched) {
            getClient(function (client) {
                console.log("GSight: window.gsight.run called - launching gsight. Run Mode: " + config.runMode);
                client.manualLaunch().then(function () {
                    console.log("GSight: in window.gsight.run - launch completed.");

                    if (onLaunched) {
                        onLaunched();
                    }
                });
            });
        };

        /**
         * Call this to find out of the user should see gsight based on criteria such as never cookie, now cookie,
         * ip filters, etc.
         * @param {any} onResultReady A callback with one parameter: shouldSee - boolean - true if the user should see gsight, false if not
         */
        window.gsight.shouldUserSee = function (onResultReady) {
            console.log("GSight: window.gsight.shouldUserSee called");

            getClient(function (client) {
                client.shouldUserSee().then(function (shouldSee) {
                    console.log("GSight: window.gsight.shouldUserSee result: " + shouldSee);
                    onResultReady(shouldSee);
                });
            });
        };
    } else {
        console.log("GSight: Automatic trigger detected. Launching... Run Mode: " + config.runMode);
    }

    run();

    function run() {
        console.log("GSight: Loading necessary resources...");

        if (!window.requirejs) {
            var scr = document.createElement("script");
            scr.src = config.baseUrl + "/vendor/requirejs/require.js";
            scr.type = "text/javascript";
            scr.async = false;
            document.head.appendChild(scr);
            scr.onload = function () {
                // Some shenanigans to prevent conflicts with websites that use custom code to asyncronously load some scripts
                // that happen to check for amd, but are not loaded in a way that supports it.
                // The delay caused by asyncronous loading ends up causing an anonymous define error with requirejs.
                var oldAmd = window.define.amd;
                window.define.amd = undefined;
                configureGSight(oldAmd, window.requirejs);
            };
        } else {
            configureGSight(undefined, window.requirejs);
        }
    }

    function configureGSight(oldAmd, tempRequirejs) {
        var delay = config.chaosDelay;

        // dont delay in survey popup
        if (window.gsightSurveyPopup) {
            delay = 0;
        }

        // Delay configuring gsight to give host website's potential chaos a chance to finish exploding.
        // Adjust or remove this delay via config.chaosDelay
        setTimeout(function () {
            // Hopefully the dust has settled and amd can now be re-introduced without the hurting and the biting
            // and the kicking and screaming and shoving.  If not, increase config.chaosDelay as needed.
            if (oldAmd) {
                window.define.amd = oldAmd;
            }

            define("WebsiteClient/config", function () {
                return config;
            });

            if (window.jQuery && config.useExistingJQuery) {
                console.log("GSight: Jquery detected.  Configuring module to use it.");
                define("jquery", [], function () {
                    return jQuery;
                });
            }

            var paths = {
                "ejs": "vendor/ejs/ejs.min",
                "promise-polyfill": "vendor/promise-polyfill/promise.min",
                "js-cookie": "vendor/js-cookie/js.cookie.min",
                "ua-parser-js": "vendor/ua-parser/ua-parser.min",
                "moment": "vendor/momentjs/moment.min",
                "ipaddr": "vendor/ipaddr/ipaddr.min"
            };

            var map = {};

            if (!window.jQuery || !config.useExistingJQuery) {
                console.log("GSight: Jquery not detected.  Adding to requirejs");
                paths["jquery"] = "vendor/jquery/jquery.min";
                map = {
                    "*": { "jquery": "jquery-private" },
                    "jquery-private": { "jquery": "jquery" }
                };
            }

            var gsightRequire = tempRequirejs.config({
                baseUrl: config.baseUrl,
                context: "gsight2Website",
                paths: paths,
                shim: {
                    "ejs": {
                        exports: "ejs"
                    },
                    "ipaddr": {
                        exports: "ipaddr"
                    }
                },
                map: map
            });

            gsightRequire(["WebsiteClient"], function (WebsiteClient) {
                var client = new WebsiteClient();
                client.run().then(function () {
                    window.gsight.client = client;
                });
            });
        }, delay);
    }
})();
