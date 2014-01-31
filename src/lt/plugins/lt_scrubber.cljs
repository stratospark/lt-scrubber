(ns lt.plugins.lt-scrubber
  (:require [lt.object :as object]
            [lt.objs.command :as cmd]
            [lt.objs.editor :as editor]
            [lt.objs.editor.pool :as pool]
            [lt.util.dom :as dom]
            [crate.binding :as binding])
  (:require-macros [lt.macros :refer [defui behavior]]))

;; These are some regex helper functions to find the position
;; of matches. This is currently not built into Clojurescript.
;; We will be using various regex to match for the different
;; types of values that can be scrubbed
;;
;; http://stackoverflow.com/questions/18735665/how-can-i-get-the-positions-of-regex-matches-in-clojurescript
(defn regex-modifiers
  "Returns the modifiers of a regex, concatenated as a string."
  [re]
  (str (if (.-multiline re) "m")
       (if (.-ignoreCase re) "i")))

(defn re-pos
  "Returns a vector of vectors, each subvector containing in order:
   the position of the match, the matched string, and any groups
   extracted from the match."
  [re s]
  (let [re (js/RegExp. (.-source re) (str "g" (regex-modifiers re)))]
    (loop [res []]
      (if-let [m (.exec re s)]
        (recur (conj res (vec (cons (.-index m) m))))
        res))))

(comment (
  (. (js/RegExp. (.-source #"-?\d*\.?\d+") (str "g")) exec "1 2 3")
  (. (js/RegExp. (.-source #"h") (str "g")) exec "this is h h")))

;; Given a string and a regex to match, this function returns the
;; match that intersects a target position within the string.
;; Typically, the target-pos will be selected by the mouse, or be
;; the character underneath the keyboard cursor.
(defn find-match-near-pos [regex string target-pos]
  (filter (fn [x]
            (let [[match-pos match-str] x
                  end-pos (+ match-pos (count match-str))]
              (comment (print (str "match-pos: " match-pos ", "
                           "target-pos: " target-pos ", "
                           "end-pos: " end-pos)))
              (and (<= match-pos target-pos)
                       (>= end-pos target-pos))))
          (re-pos regex string)))

;; This regex matches positive and negative integers and floating
;; point numbers
(def simple-number-regex #"-?\d*\.?\d+")

;; TODO: hex color regex?

(find-match-near-pos simple-number-regex "I have 1 cookie 30" 3)
(find-match-near-pos simple-number-regex "I have 1 cookie 30" 7)
(find-match-near-pos simple-number-regex "I have 1 cookie 30" 17)

;; We then parse a line of text using a
;; TODO: is this extraneous?
(defn parse-for-scrub [line-text target-pos]
  (let [match (find-match-near-pos simple-number-regex line-text target-pos)]
    (flatten match)))

(defn adder [x y]
  (+ x y))

(defn circle-radius [r]
  (* 3.1492653 (* r r)))

(adder 144 244)

(circle-radius 219.6)

;; This holds the global state for this plugin
(def app-state (atom {:last-range 0}))

;; This returns the number of places to the right of a decimal point
;; in a string representation of an integer or floating point number
(defn number-of-decimal-places [num-str]
  (let [length-of-number (count num-str)
        pos-of-decimal (inc (.. num-str (indexOf ".")))]
    (if (= pos-of-decimal 0)
      0
      (- length-of-number pos-of-decimal))))

(number-of-decimal-places "10")
(number-of-decimal-places "10.0")
(number-of-decimal-places "10.123")
(number-of-decimal-places "-10.12")

;; We take a given value and increment it or decrement it based on
;; the number of decimal places it may have.
(defn get-next-value [current-value val-delta]
  (let [value-as-num (js/parseFloat current-value)
        num-decimal-places (number-of-decimal-places current-value)
        increment (/ 1 (Math/pow 10 num-decimal-places))
        next-value (.. (+ value-as-num (* val-delta increment))
                       (toFixed num-decimal-places))]
    next-value))

(get-next-value "100" 1)
(get-next-value "100" -1)
(get-next-value "100.0" 1)
(get-next-value "100.0" -1)
(get-next-value "0.00" 1)
(get-next-value "0.00" -1)

;; When the user mouses down on a valid value, we are going to
;; dynamically add and remove mousemove/mouseup handlers that
;; will scrub the value up or down based on the mouse position
(defn attach-scrub-handlers [e ed value-to-scrub pos]
  (if (> (count value-to-scrub) 0)
    (do
      (. e (stopPropagation))
      (. e (preventDefault))
      (let [[scrub-pos scrub-value] value-to-scrub
            last-range {:start {:line (.-line pos)
                                :ch scrub-pos}
                        :end {:line (.-line pos)
                              :ch (+ scrub-pos (count (str scrub-value)))}}
            cm (editor/->cm-ed ed)
            scroller (.getScrollerElement cm)
            down-x (.-pageX e)
            last-text scrub-value
            origin (str "*scrubber" (rand-int 100000)) ;; set unique label for undo. TODO: monotonic increment?
            move-handler (fn [e]
                           (. e (stopPropagation))
                           (. e (preventDefault))
                           (let [px-delta (- (.-pageX e) down-x)
                                 val-delta (bit-or (/ px-delta 8) 0)
                                 new-text (get-next-value scrub-value val-delta)
                                 last-range (get-in @app-state [:last-range])]
                             (if (not= new-text last-text)
                               (do
                                 (.replaceRange cm new-text
                                                (clj->js (:start last-range))
                                                (clj->js (:end last-range))
                                                origin)
                                 (swap! app-state update-in [:last-range :end :ch]
                                        #(+ (get-in last-range [:start :ch]) (count new-text)))
                                 (editor/set-selection ed pos) ;; temporarily deselect text, so entire form evals
                                 (cmd/exec! :eval-editor-form) ;; TODO: speed this up somehow? avoid saves?
                                 (editor/set-selection ed (:start last-range) (:end last-range))
                                 ))))
                             ]
        (swap! app-state update-in [:last-range] (fn [] last-range))
        (editor/set-selection ed (:start last-range) (:end last-range))
        (.. window/document
            (addEventListener "mousemove" move-handler))
        (.. window/document
            (addEventListener "mouseup"
                              (fn [e]
                                (.. window/document (removeEventListener "mousemove" move-handler)))))))))

(defn mouse-down-fn* [e]
  "Real handler for mouse-down on a LightTable editor pane"
    (if (or (.-metaKey e)
            (.-altKey e))
      (let [ed (pool/last-active)
            cm (editor/->cm-ed ed)
            page-x (.-pageX e)
            page-y (.-pageY e)
            pos (.. cm (coordsChar #js {:left page-x :top page-y}))
            line-text (editor/line ed (.-line pos))
            value-to-scrub (parse-for-scrub line-text (.-ch pos))]
        (attach-scrub-handlers e ed value-to-scrub pos))))

;; TODO: can we just use the mouse-down-fn* directly?
(defn mouse-down-fn [e]
  (mouse-down-fn* e))

;; We also support nudging a value by a small amount using the keyboard
(defn nudge [dir]
  ;; handle keyboard specific
  (let [ed (pool/last-active)
        cm (editor/->cm-ed ed)
        pos (.getCursor cm)
        line-text (editor/line ed (.-line pos))
        value-to-scrub (parse-for-scrub line-text (.-ch pos))
        [scrub-pos scrub-value] value-to-scrub
        last-text scrub-value
        origin (str "*scrubber" (rand-int 100000)) ;; set unique label for undo. TODO: monotonic increment?
                    last-range {:start {:line (.-line pos)
                                :ch scrub-pos}
                        :end {:line (.-line pos)
                              :ch (+ scrub-pos (count (str scrub-value)))}}
        ]
    (print "nudge " dir)
    (swap! app-state update-in [:last-range] (fn [] last-range))
    (editor/set-selection ed (:start last-range) (:end last-range))
    (let [new-text (get-next-value scrub-value dir)
          last-range (get-in @app-state [:last-range])]
      (if (not= new-text last-text)
        (do
          (.replaceRange cm new-text
                         (clj->js (:start last-range))
                         (clj->js (:end last-range))
                         origin)
          (swap! app-state update-in [:last-range :end :ch]
                 #(+ (get-in last-range [:start :ch]) (count new-text)))
          (editor/set-selection ed pos) ;; temporarily deselect text, so entire form evals
          (cmd/exec! :eval-editor-form) ;; TODO: speed this up somehow? avoid saves?
          (editor/set-selection ed (:start last-range) (:end last-range))
                                 )))))

;; TODO: can we just use an already existing behavior
(behavior ::eval-on-change
          :triggers #{:change}
          ;;:debounce 200
          :reaction (fn [this]
                      (do
                        (.log js/console "eval on change")
                        (js/setTimeout #(cmd/exec! :eval-editor-form) 0))))

;; This is a UI element that allows you to toggle the scrubbing
;; functionality on or off
(defui scrubber-toggler [this]
  [:div#instarepl
   [:span
    {:class (binding/bound this #(str "livetoggler " (when-not (:active %) "off")))} "scrubber"
    ]
   ]
  :click (fn [e]
           (.log js/console "you clicked it!")
           (dom/prevent e)
           (object/raise (:editor @this) :scrubber.toggle!)))

;; This Light Table object template contains the UI and whether
;; the scrubber is active or not. It attaches the UI to the
;; editor DOM
(object/object* ::scrubber
                :tags #{::scrubber}
                :name "Scrubber Toggler"
                :active true
                :init (fn [this editor]
                        (object/merge! this {:editor editor})
                        (let [editor-content (object/->content editor)
                              frame (dom/parent editor-content)
                              toggler (scrubber-toggler this)]
                          (dom/append toggler editor-content)
                          (dom/append frame toggler))))

;; This function removes the scrubbing UI from the editor
;; and removes the mousedown event listener
(defn scrubber-off [editor]
  (print "scrubber-off")
  (object/remove-tags editor [:editor.scrubber.active])
  (when-let [scrubber (::scrubber @editor)]
    (object/merge! scrubber {:active false}))
  (let [cm (editor/->cm-ed editor)
         scroller (.getScrollerElement cm)]
     (.removeEventListener scroller "mousedown" mouse-down-fn)))

;; This function creates the scrubbing object if it doesn't
;; exist, and adds it to the editor, as well as registering
;; event listeners for the mousedown event
(defn scrubber-on [editor]
  (print "scrubber-on")
  (when-not (::scrubber @editor)
    (object/merge! editor {::scrubber (object/create ::scrubber editor)}))
  (object/add-tags editor [:editor.scrubber.active])
  (object/merge! (::scrubber @editor) {:active true})
  (let [cm (editor/->cm-ed editor)
         scroller (.getScrollerElement cm)]
     (.addEventListener scroller "mousedown" mouse-down-fn)))

;; This command triggers a behavior that will toggle the
;; scrubbing mode on or off
(behavior ::scrubber-toggle
          :desc "Editor: Toggle scrubbing mode"
          :triggers #{:scrubber.toggle!}
          :reaction (fn [editor]
                      (print "behavior scrubber-toggle")
                      (if (object/has-tag? editor :editor.scrubber.active)
                        (scrubber-off editor)
                        (scrubber-on editor))))

(cmd/command {:command ::toggle
              :desc "Editor: Toggle scrubbing mode"
              :exec (fn []
                      (when-let [ed (pool/last-active)]
                        (object/raise ed :scrubber.toggle!)))})

;; These commands nudge a value up or down
(cmd/command {:command ::increment-value
              :desc "Scrubber: Increment selected value"
              :exec (fn [] (nudge 1))})

(cmd/command {:command ::decrement-value
              :desc "Scrubber: Decrement selected value"
              :exec (fn [] (nudge -1))})
