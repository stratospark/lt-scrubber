# Scrubber for Light Table


This is a [Light Table](https://github.com/LightTable/LightTable) plugin that will allow you to rapidly change the value of a number with the mouse or keyboard, then automatically evaluate your code so you can get instant feedback.

It works great for visualizing CSS changes live, as well as for getting a feel for data flow through Clojure/Clojurescript code with form evaluation and watches.

See it in action in this [screencast](http://quick.as/dwglfjgq)!

## Usage
To activate, run the command **Editor: Toggle scrubbing mode**. Find a number that you want to scrub, hold down the **Command** or **Alt** key, then click and drag your mouse to the left or right. The more decimal places a value has, the slower it will increment or decrement, allowing you to dial in the exact amount.

You can also use the keyboard to "nudge" a value by the smallest increment or decrement possible. Move your cursor of the value you want to nudge then hold **shift-ctrl-up** or **shift-ctrl-down**.

Finally, you can add the **activate-scrubber** behavior to *users.behaviors* if you want scrubbing mode to automatically be available in a given file type:
```
:editor.clojure [(:lt.objs.langs.clj/print-length 1000)
                  :lt.plugins.lt-scrubber/activate-scrubber]

:editor.css [:lt.plugins.lt-scrubber/activate-scrubber]
```

## Inspiration
This code is largely a port of Peter Flynn's [everyscrub](https://github.com/peterflynn/everyscrub) extension for the Brackets editor.

I am also hugely inspired by Bret Victor's work. In this case, specifically the [Tangle](http://worrydream.com/Tangle/) reactive documents library for Javascript, and Bret's talk [Inventing on Principle](http://vimeo.com/36579366).

I'm hoping that with Light Table, together we can push the limits of programming UX!

## License
(c) 2014 Patrick Rodriguez. MIT open-source license.
