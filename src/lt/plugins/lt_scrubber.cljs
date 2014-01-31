;; Scrubber for Light Table 0.0.1
;; (c) 2014 Patrick Rodriguez. MIT open-source license.

;; Here we're requiring the bare minimum Light Table namespaces
(ns lt.plugins.lt-scrubber
  (:require [lt.object :as object]
            [lt.objs.command :as cmd]
            [lt.objs.editor :as editor]
            [lt.objs.editor.pool :as pool]
            [lt.util.dom :as dom])
  (:require-macros [lt.macros :refer [behavior]]))

;; These are some regex helper functions to find the position
;; of matches. This is currently not built into Clojurescript.
;; We will be using various regex to match for the different
;; types of values that can be scrubbed.
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
  ;; regex playground!
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
;; TODO: is this extraneous? maybe it'll be needed for multiple regex types
(defn parse-for-scrub [line-text target-pos]
  (let [match (find-match-near-pos simple-number-regex line-text target-pos)]
    (flatten match)))

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

;; This holds the global state for this plugin
(def app-state (atom {:last-range 0
                      :origin ""}))

;; This is where the magic happens. We update the selected value
;; based on whether we are handling a continuous mouse scrub or
;; a single keyboard nudge. Most of the logic is shared, except
;; we need to dynamically add and remove mousemove/mouseup handlers.
(defn handle-keyboard-or-mouse-scrub [{:keys [type delta e]}]
  (if (or
       (= type :keyboard)
       ;; Alt-mouse click on window/linux, command-mouse on mac
       (and (= type :mouse) (or (.-metaKey e) (.-altKey e))))
      (let [ed (pool/last-active)
            cm (editor/->cm-ed ed)

            ;; We pick out the range of text that matches the regex
            ;; based on the position of the mouse or the keyboard cursor.
            pos  (condp = type
                       :mouse (.. cm (coordsChar #js {:left (.-pageX e) :top (.-pageY e)}))
                       :keyboard (.getCursor cm))
            line-text (editor/line ed (.-line pos))
            value-to-scrub (parse-for-scrub line-text (.-ch pos))
            [scrub-pos scrub-value] value-to-scrub
            last-range {:start {:line (.-line pos)
                                :ch scrub-pos}
                        :end {:line (.-line pos)
                              :ch (+ scrub-pos (count (str scrub-value)))}}

            last-text scrub-value

            ;; This is a unique string for CodeMirror's replaceRange, so that
            ;; we can undo to before the beginning of a scrub action
            origin (str "*scrubber" (:origin (swap! app-state update-in [:origin] inc)))

            ;; This method performs the scrub after setting up the mouse or
            ;; keyboard specific logic
            do-scrub! (fn [val-delta]
                        (let [new-text (get-next-value scrub-value val-delta)
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
                              (cmd/exec! :eval-editor-form) ;; TODO: is there anyway to speed this up?
                              (editor/set-selection ed (:start last-range) (:end last-range)) ;; reselect text
                              ))))]

        ;; Update the state with this initial selected range before scrubbing
        (swap! app-state update-in [:last-range] (fn [] last-range))
        (editor/set-selection ed (:start last-range) (:end last-range)) ;; select the matched value

        ;; Input type specific handling
        (condp = type
          :mouse (let [scroller (.getScrollerElement cm)
                       down-x (.-pageX e)

                       ;; We want the mouse cursor to be a resizer, but to reset it
                       ;; to whatever it used to be after the handler is removed.
                       set-css-cursor (fn [cursors]
                                        (let [[val-1 val-2 val-3] cursors]
                                          (dom/css (dom/$ ".CodeMirror-lines") {:cursor val-1})
                                          (dom/css (dom/$ ".CodeMirror-gutter-elt") {:cursor val-2})
                                          (dom/css (dom/$ "html") {:cursor val-3})))
                       old-css-cursors [(dom/css (dom/$ ".CodeMirror-lines") :cursor)
                                        (dom/css (dom/$ ".CodeMirror-gutter-elt") :cursor)
                                        (dom/css (dom/$ "html") :cursor)]

                       ;; Scrub based on how far the mouse moves left or right from select value
                       move-handler (fn [e]
                                      (. e (stopPropagation))
                                      (. e (preventDefault))
                                      (let [px-delta (- (.-pageX e) down-x)
                                            val-delta (bit-or (/ px-delta 8) 0)]
                                        (do-scrub! val-delta)))]

                   (set-css-cursor (repeat 3 "col-resize"))

                   ;; Add the mouse handlers temporarily until mouse click is released
                   (.. window/document (addEventListener "mousemove" move-handler))
                   (.. window/document (addEventListener "mouseup"
                     (fn [e]
                       (.. window/document (removeEventListener "mousemove" move-handler))
                       (set-css-cursor old-css-cursors)))))

          :keyboard (do-scrub! delta)))))

;; We send the mouse-event to the scrub handler method for processing
(defn mouse-down-fn [e]
  (handle-keyboard-or-mouse-scrub {:type :mouse
                                   :e e}))

;; We also support nudging a value by a small amount using the keyboard
;; dir will be 1 for incrementing and -1 for decrementing
(defn nudge [dir]
  (handle-keyboard-or-mouse-scrub {:type :keyboard
                                   :delta dir}))

;; This Light Table object template contains whether the
;; scrubber is active or not.
(object/object* ::scrubber
                :tags #{::scrubber}
                :name "Scrubber Toggler"
                :active true
                :init (fn [this editor]
                        (object/merge! this {:editor editor})))

;; This function removes the scrubbing behavior from the editor
;; and removes the mousedown event listener
(defn scrubber-off [editor]
  (print "Scrubber Off")
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
  (print "Scrubber On")
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
