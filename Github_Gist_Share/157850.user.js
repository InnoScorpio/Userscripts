// ==UserScript==
// @name        Github Gist Share
// @namespace   https://github.com/jerone/UserScripts/
// @description Share your GitHub Gist to Twitter, Dabblet & as userscript.
// @author      jerone
// @homepage    https://github.com/jerone/UserScripts/tree/master/Github_Gist_Share
// @homepageURL https://github.com/jerone/UserScripts/tree/master/Github_Gist_Share
// @downloadURL https://github.com/jerone/UserScripts/raw/master/Github_Gist_Share/157850.user.js
// @updateURL   https://github.com/jerone/UserScripts/raw/master/Github_Gist_Share/157850.user.js
// @include     *://gist.github.com/*
// @version     4.2
// @grant       none
// ==/UserScript==

(function() {

	String.format = function(string) {
		var args = Array.prototype.slice.call(arguments, 1, arguments.length);
		return string.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != "undefined" ? args[number] : match;
		});
	};

	var socials = {
		Twitter: {
			show: function(url, user, description, files, stars, forks, revisions) {
				return true;
			},
			submit: function(url, user, description, files, stars, forks, revisions) {
				var stats = [];
				if (files > 1) {
					stats.push(files + " files");
				}
				if (stars == 1) {
					stats.push(stars + " star");
				} else if (stars > 1) {
					stats.push(stars + " stars");
				}
				if (forks == 1) {
					stats.push(forks + " fork");
				} else if (forks > 1) {
					stats.push(forks + " forks");
				}
				if (revisions > 1) {
					stats.push(revisions + " revisions");
				}

				var tweet = String.format("Check out {0} #gist {1} on @github{2} |",
											user == document.querySelector(".name").textContent.trim() ? "my" : user + "'s",
											description ? "\"" + description + "\"" : "",
											stats.length > 0 ? " | " + stats.join(", ") : "");

				return "https://twitter.com/intent/tweet?original_referer=" + encodeURIComponent(url) +
							"&source=tweetbutton&url=" + encodeURIComponent(url) +
							"&text=" + encodeURIComponent(tweet);
			},
			icon: "https://si0.twimg.com/favicons/favicon.ico"
		},
		Dabblet: {
			/*
			 * The following urls should be converted to dabblet:
			 *
			 *  - https://gist.github.com/jerone/3810309
			 *                                   ŻŻŻŻŻŻŻ
			 *  - https://gist.github.com/jerone/3810309/revisions
			 *                                   ŻŻŻŻŻŻŻ
			 *  - https://gist.github.com/jerone/3810309/forks
			 *                                   ŻŻŻŻŻŻŻ
			 *  - https://gist.github.com/jerone/3810309/stars
			 *                                   ŻŻŻŻŻŻŻ
			 *  - https://gist.github.com/jerone/3810309/f2815cc6796ea985f74b8f5f3c717e8de3b12d37
			 *                                   ŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻ
			 *  - https://gist.github.com/3810309/f2815cc6796ea985f74b8f5f3c717e8de3b12d37
			 *                            ŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻŻ
			 */
			show: function(url, user, description, files, stars, forks, revisions) {
				// already defined in another UserScript: http://userscripts.org/users/31497/scripts
				return !document.getElementById("Github_Gist_Dabblet");
			},
			submit: function(url, user, description, files, stars, forks, revisions) {
				var linkLong;
				if ((linkLong = document.querySelector(".site-container.js-site-container")) && linkLong.dataset.url) {
					var linkLongParts = linkLong.dataset.url.split("/");
					linkLongParts.shift();
					if (/^(?:revisions|forks|stars)$/gi.test(linkLongParts[linkLongParts.length - 1])) {
						linkLongParts.pop();
					}
					if (new RegExp(user, "gi").test(linkLongParts[0])) {
						linkLongParts.shift();
					}
					url = "/" + linkLongParts.join("/");
				} else {
					url = url.replace(new RegExp("https?:\/\/gist\.github\.com/" + user, "gi"), "");
				}
				return "http://dabblet.com/gist" + url;
			},
			icon: "http://dabblet.com/favicon.ico"
		},
		UserScript: {
			show: function(url, user, description, files, stars, forks, revisions) {
				return !!document.querySelector(".bubble[id^='file-'] .raw-url[href$='.user.js']");
			},
			submit: function(url, user, description, files, stars, forks, revisions) {
				return (document.querySelector(".bubble[id^='file-'] .raw-url[href$='.user.js']") || { href: "" }).href.trim();
			},
			icon: "https://userscripts.org/images/script_icon.png"
		}
	};

	function addMenuItem() {
		var link, url, menu, li, user, description, files, stars, forks, revisions;

		if ((link = document.querySelector("[name='link-field']")) && (menu = document.querySelector('ul.menu.gisttabs'))) {  // check if we're on an actual gists;
			url = link.value;
			user = document.querySelector(".author.vcard").textContent.trim();
			description = (document.querySelector(".gist-description") || document.querySelector(".js-current-repository") || { textContent: "" }).textContent.trim();
			files = document.querySelectorAll(".bubble[id^='file-']").length;
			stars = (menu.querySelector("a[href$='/stars'] .counter") || { textContent: "" }).textContent.trim();
			forks = (menu.querySelector("a[href$='/forks'] .counter") || { textContent: "" }).textContent.trim();
			revisions = (menu.querySelector("a[href$='/revisions'] .counter") || { textContent: "" }).textContent.trim();

			menu.appendChild(li = document.createElement("li"));
			li.id = "Github_Gist_Share";

			for (var key in socials) {
				var social = socials[key],
					socialA = document.createElement("a"),
					socialImg = document.createElement("img");

				if (social.show(url, user, description, files, stars, forks, revisions) !== true) continue;

				li.appendChild(socialA);
				socialA.appendChild(socialImg);
				socialA.id = String.format("{0}_{1}", li.id, key.replace(/\s+/g, "_"));
				socialA.href = social.submit && social.submit(url, user, description, files, stars, forks, revisions);
				socialA.title = String.format("[{0}] {1}", key, socialA.href);
				socialA.style.display = "inline-block";
				socialA.target = "_blank";
				socialImg.src = social.icon;
				socialImg.alt = key;
			}
		}
	}

	// init;
	addMenuItem();

	// on pjax;
	unsafeWindow.$(document).on("pjax:success", addMenuItem);

})();
