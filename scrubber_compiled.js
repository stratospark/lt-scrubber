if(!lt.util.load.provided_QMARK_('lt.plugins.lt-scrubber')) {
goog.provide('lt.plugins.lt_scrubber');
goog.require('cljs.core');
goog.require('lt.util.dom');
goog.require('lt.util.dom');
goog.require('lt.objs.editor.pool');
goog.require('lt.objs.command');
goog.require('lt.objs.editor');
goog.require('lt.object');
goog.require('lt.object');
goog.require('lt.objs.editor');
goog.require('lt.objs.editor.pool');
goog.require('lt.objs.command');
/**
* Returns the modifiers of a regex, concatenated as a string.
*/
lt.plugins.lt_scrubber.regex_modifiers = (function regex_modifiers(re){return [cljs.core.str((cljs.core.truth_(re.multiline)?"m":null)),cljs.core.str((cljs.core.truth_(re.ignoreCase)?"i":null))].join('');
});
/**
* Returns a vector of vectors, each subvector containing in order:
* the position of the match, the matched string, and any groups
* extracted from the match.
*/
lt.plugins.lt_scrubber.re_pos = (function re_pos(re,s){var re__$1 = (new RegExp(re.source,[cljs.core.str("g"),cljs.core.str(lt.plugins.lt_scrubber.regex_modifiers.call(null,re))].join('')));var res = cljs.core.PersistentVector.EMPTY;while(true){
var temp__4090__auto__ = re__$1.exec(s);if(cljs.core.truth_(temp__4090__auto__))
{var m = temp__4090__auto__;{
var G__9802 = cljs.core.conj.call(null,res,cljs.core.vec.call(null,cljs.core.cons.call(null,m.index,m)));
res = G__9802;
continue;
}
} else
{return res;
}
break;
}
});
lt.plugins.lt_scrubber.find_match_near_pos = (function find_match_near_pos(regex,string,target_pos){return cljs.core.filter.call(null,(function (x){var vec__9782 = x;var match_pos = cljs.core.nth.call(null,vec__9782,0,null);var match_str = cljs.core.nth.call(null,vec__9782,1,null);var end_pos = (match_pos + cljs.core.count.call(null,match_str));return ((match_pos <= target_pos)) && ((end_pos >= target_pos));
}),lt.plugins.lt_scrubber.re_pos.call(null,regex,string));
});
lt.plugins.lt_scrubber.simple_number_regex = /-?\d*\.?\d+/;
lt.plugins.lt_scrubber.find_match_near_pos.call(null,lt.plugins.lt_scrubber.simple_number_regex,"I have 1 cookie 30",3);
lt.plugins.lt_scrubber.find_match_near_pos.call(null,lt.plugins.lt_scrubber.simple_number_regex,"I have 1 cookie 30",7);
lt.plugins.lt_scrubber.find_match_near_pos.call(null,lt.plugins.lt_scrubber.simple_number_regex,"I have 1 cookie 30",17);
lt.plugins.lt_scrubber.parse_for_scrub = (function parse_for_scrub(line_text,target_pos){var match = lt.plugins.lt_scrubber.find_match_near_pos.call(null,lt.plugins.lt_scrubber.simple_number_regex,line_text,target_pos);return cljs.core.flatten.call(null,match);
});
lt.plugins.lt_scrubber.number_of_decimal_places = (function number_of_decimal_places(num_str){var length_of_number = cljs.core.count.call(null,num_str);var pos_of_decimal = (num_str.indexOf(".") + 1);if(cljs.core._EQ_.call(null,pos_of_decimal,0))
{return 0;
} else
{return (length_of_number - pos_of_decimal);
}
});
lt.plugins.lt_scrubber.number_of_decimal_places.call(null,"10");
lt.plugins.lt_scrubber.number_of_decimal_places.call(null,"10.0");
lt.plugins.lt_scrubber.number_of_decimal_places.call(null,"10.123");
lt.plugins.lt_scrubber.number_of_decimal_places.call(null,"-10.12");
lt.plugins.lt_scrubber.get_next_value = (function get_next_value(current_value,val_delta){var value_as_num = parseFloat(current_value);var num_decimal_places = lt.plugins.lt_scrubber.number_of_decimal_places.call(null,current_value);var increment = (1 / Math.pow.call(null,10,num_decimal_places));var next_value = (value_as_num + (val_delta * increment)).toFixed(num_decimal_places);return next_value;
});
lt.plugins.lt_scrubber.get_next_value.call(null,"100",1);
lt.plugins.lt_scrubber.get_next_value.call(null,"100",-1);
lt.plugins.lt_scrubber.get_next_value.call(null,"100.0",1);
lt.plugins.lt_scrubber.get_next_value.call(null,"100.0",-1);
lt.plugins.lt_scrubber.get_next_value.call(null,"0.00",1);
lt.plugins.lt_scrubber.get_next_value.call(null,"0.00",-1);
lt.plugins.lt_scrubber.try_to_get_or_set_css = (function try_to_get_or_set_css(selector,attrs){var temp__4092__auto__ = lt.util.dom.$.call(null,selector);if(cljs.core.truth_(temp__4092__auto__))
{var d = temp__4092__auto__;return lt.util.dom.css.call(null,d,attrs);
} else
{return null;
}
});
lt.plugins.lt_scrubber.app_state = cljs.core.atom.call(null,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"last-range","last-range",1863387832),0,new cljs.core.Keyword(null,"origin","origin",4300251800),""], null));
lt.plugins.lt_scrubber.handle_keyboard_or_mouse_scrub = (function handle_keyboard_or_mouse_scrub(p__9783){var map__9793 = p__9783;var map__9793__$1 = ((cljs.core.seq_QMARK_.call(null,map__9793))?cljs.core.apply.call(null,cljs.core.hash_map,map__9793):map__9793);var e = cljs.core.get.call(null,map__9793__$1,new cljs.core.Keyword(null,"e","e",1013904343));var delta = cljs.core.get.call(null,map__9793__$1,new cljs.core.Keyword(null,"delta","delta",1109372714));var type = cljs.core.get.call(null,map__9793__$1,new cljs.core.Keyword(null,"type","type",1017479852));if(cljs.core.truth_((function (){var or__8518__auto__ = cljs.core._EQ_.call(null,type,new cljs.core.Keyword(null,"keyboard","keyboard",1517643609));if(or__8518__auto__)
{return or__8518__auto__;
} else
{var and__8506__auto__ = cljs.core._EQ_.call(null,type,new cljs.core.Keyword(null,"mouse","mouse",1117990935));if(and__8506__auto__)
{var or__8518__auto____$1 = e.metaKey;if(cljs.core.truth_(or__8518__auto____$1))
{return or__8518__auto____$1;
} else
{return e.altKey;
}
} else
{return and__8506__auto__;
}
}
})()))
{var ed = lt.objs.editor.pool.last_active.call(null);var cm = lt.objs.editor.__GT_cm_ed.call(null,ed);var pos = (function (){var pred__9795 = cljs.core._EQ_;var expr__9796 = type;if(cljs.core.truth_(pred__9795.call(null,new cljs.core.Keyword(null,"mouse","mouse",1117990935),expr__9796)))
{return cm.coordsChar({"top": e.pageY, "left": e.pageX});
} else
{if(cljs.core.truth_(pred__9795.call(null,new cljs.core.Keyword(null,"keyboard","keyboard",1517643609),expr__9796)))
{return cm.getCursor();
} else
{throw (new Error([cljs.core.str("No matching clause: "),cljs.core.str(expr__9796)].join('')));
}
}
})();var line_text = lt.objs.editor.line.call(null,ed,pos.line);var value_to_scrub = lt.plugins.lt_scrubber.parse_for_scrub.call(null,line_text,pos.ch);var vec__9794 = value_to_scrub;var scrub_pos = cljs.core.nth.call(null,vec__9794,0,null);var scrub_value = cljs.core.nth.call(null,vec__9794,1,null);var last_range = new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"start","start",1123661780),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",1017226086),pos.line,new cljs.core.Keyword(null,"ch","ch",1013907415),scrub_pos], null),new cljs.core.Keyword(null,"end","end",1014004813),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"line","line",1017226086),pos.line,new cljs.core.Keyword(null,"ch","ch",1013907415),(scrub_pos + cljs.core.count.call(null,[cljs.core.str(scrub_value)].join('')))], null)], null);var last_text = scrub_value;var origin = [cljs.core.str("*scrubber"),cljs.core.str(new cljs.core.Keyword(null,"origin","origin",4300251800).cljs$core$IFn$_invoke$arity$1(cljs.core.swap_BANG_.call(null,lt.plugins.lt_scrubber.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"origin","origin",4300251800)], null),cljs.core.inc)))].join('');var do_scrub_BANG_ = ((function (ed,cm,pos,line_text,value_to_scrub,vec__9794,scrub_pos,scrub_value,last_range,last_text,origin){
return (function (val_delta){var new_text = lt.plugins.lt_scrubber.get_next_value.call(null,scrub_value,val_delta);var last_range__$1 = cljs.core.get_in.call(null,cljs.core.deref.call(null,lt.plugins.lt_scrubber.app_state),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"last-range","last-range",1863387832)], null));if(cljs.core.not_EQ_.call(null,new_text,last_text))
{cm.replaceRange(new_text,cljs.core.clj__GT_js.call(null,new cljs.core.Keyword(null,"start","start",1123661780).cljs$core$IFn$_invoke$arity$1(last_range__$1)),cljs.core.clj__GT_js.call(null,new cljs.core.Keyword(null,"end","end",1014004813).cljs$core$IFn$_invoke$arity$1(last_range__$1)),origin);
cljs.core.swap_BANG_.call(null,lt.plugins.lt_scrubber.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"last-range","last-range",1863387832),new cljs.core.Keyword(null,"end","end",1014004813),new cljs.core.Keyword(null,"ch","ch",1013907415)], null),((function (new_text,last_range__$1,ed,cm,pos,line_text,value_to_scrub,vec__9794,scrub_pos,scrub_value,last_range,last_text,origin){
return (function (){return (cljs.core.get_in.call(null,last_range__$1,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"start","start",1123661780),new cljs.core.Keyword(null,"ch","ch",1013907415)], null)) + cljs.core.count.call(null,new_text));
});})(new_text,last_range__$1,ed,cm,pos,line_text,value_to_scrub,vec__9794,scrub_pos,scrub_value,last_range,last_text,origin))
);
lt.objs.editor.set_selection.call(null,ed,pos);
if(cljs.core.not.call(null,lt.object.has_tag_QMARK_.call(null,ed,new cljs.core.Keyword(null,"editor.clj.instarepl","editor.clj.instarepl",2477999342))))
{return lt.objs.command.exec_BANG_.call(null,new cljs.core.Keyword(null,"eval-editor-form","eval-editor-form",4138964197));
} else
{if(cljs.core._EQ_.call(null,type,new cljs.core.Keyword(null,"mouse","mouse",1117990935)))
{return lt.objs.command.exec_BANG_.call(null,new cljs.core.Keyword(null,"eval-editor-form","eval-editor-form",4138964197));
} else
{return null;
}
}
} else
{return null;
}
});})(ed,cm,pos,line_text,value_to_scrub,vec__9794,scrub_pos,scrub_value,last_range,last_text,origin))
;cljs.core.swap_BANG_.call(null,lt.plugins.lt_scrubber.app_state,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"last-range","last-range",1863387832)], null),(function (){return last_range;
}));
lt.objs.editor.set_selection.call(null,ed,new cljs.core.Keyword(null,"start","start",1123661780).cljs$core$IFn$_invoke$arity$1(last_range),new cljs.core.Keyword(null,"end","end",1014004813).cljs$core$IFn$_invoke$arity$1(last_range));
var pred__9798 = cljs.core._EQ_;var expr__9799 = type;if(cljs.core.truth_(pred__9798.call(null,new cljs.core.Keyword(null,"mouse","mouse",1117990935),expr__9799)))
{var scroller = cm.getScrollerElement();var down_x = e.pageX;var set_css_cursor = ((function (scroller,down_x){
return (function (cursors){var vec__9801 = cursors;var val_1 = cljs.core.nth.call(null,vec__9801,0,null);var val_2 = cljs.core.nth.call(null,vec__9801,1,null);var val_3 = cljs.core.nth.call(null,vec__9801,2,null);lt.plugins.lt_scrubber.try_to_get_or_set_css.call(null,".CodeMirror-lines",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cursor","cursor",3959752392),val_1], null));
lt.plugins.lt_scrubber.try_to_get_or_set_css.call(null,".CodeMirror-gutter-elt",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cursor","cursor",3959752392),val_2], null));
return lt.plugins.lt_scrubber.try_to_get_or_set_css.call(null,"html",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cursor","cursor",3959752392),val_3], null));
});})(scroller,down_x))
;var old_css_cursors = new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [lt.plugins.lt_scrubber.try_to_get_or_set_css.call(null,".CodeMirror-lines",new cljs.core.Keyword(null,"cursor","cursor",3959752392)),lt.plugins.lt_scrubber.try_to_get_or_set_css.call(null,".CodeMirror-gutter-elt",new cljs.core.Keyword(null,"cursor","cursor",3959752392)),lt.plugins.lt_scrubber.try_to_get_or_set_css.call(null,"html",new cljs.core.Keyword(null,"cursor","cursor",3959752392))], null);var move_handler = ((function (scroller,down_x,set_css_cursor,old_css_cursors){
return (function (e__$1){e__$1.stopPropagation();
e__$1.preventDefault();
var px_delta = (e__$1.pageX - down_x);var val_delta = ((px_delta / 8) | 0);var scrub_multiplier = (cljs.core.truth_(e__$1.shiftKey)?10:1);return do_scrub_BANG_.call(null,(val_delta * scrub_multiplier));
});})(scroller,down_x,set_css_cursor,old_css_cursors))
;set_css_cursor.call(null,cljs.core.repeat.call(null,3,"col-resize"));
window.document.addEventListener("mousemove",move_handler);
return window.document.addEventListener("mouseup",(function (e__$1){window.document.removeEventListener("mousemove",move_handler);
return set_css_cursor.call(null,old_css_cursors);
}));
} else
{if(cljs.core.truth_(pred__9798.call(null,new cljs.core.Keyword(null,"keyboard","keyboard",1517643609),expr__9799)))
{return do_scrub_BANG_.call(null,delta);
} else
{throw (new Error([cljs.core.str("No matching clause: "),cljs.core.str(expr__9799)].join('')));
}
}
} else
{return null;
}
});
lt.plugins.lt_scrubber.mouse_down_fn = (function mouse_down_fn(e){return lt.plugins.lt_scrubber.handle_keyboard_or_mouse_scrub.call(null,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1017479852),new cljs.core.Keyword(null,"mouse","mouse",1117990935),new cljs.core.Keyword(null,"e","e",1013904343),e], null));
});
lt.plugins.lt_scrubber.nudge = (function nudge(dir){return lt.plugins.lt_scrubber.handle_keyboard_or_mouse_scrub.call(null,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1017479852),new cljs.core.Keyword(null,"keyboard","keyboard",1517643609),new cljs.core.Keyword(null,"delta","delta",1109372714),dir], null));
});
lt.object.object_STAR_.call(null,new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893),new cljs.core.Keyword(null,"tags","tags",1017456523),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893),null], null), null),new cljs.core.Keyword(null,"name","name",1017277949),"Scrubber Toggler",new cljs.core.Keyword(null,"active","active",3885920888),true,new cljs.core.Keyword(null,"init","init",1017141378),(function (this$,editor){return lt.object.merge_BANG_.call(null,this$,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"editor","editor",4001043679),editor], null));
}));
lt.plugins.lt_scrubber.scrubber_off = (function scrubber_off(editor){cljs.core.print.call(null,"Scrubber Off");
lt.object.remove_tags.call(null,editor,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"editor.scrubber.active","editor.scrubber.active",4278144421)], null));
var temp__4092__auto___9803 = new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893).cljs$core$IFn$_invoke$arity$1(cljs.core.deref.call(null,editor));if(cljs.core.truth_(temp__4092__auto___9803))
{var scrubber_9804 = temp__4092__auto___9803;lt.object.merge_BANG_.call(null,scrubber_9804,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",3885920888),false], null));
} else
{}
var cm = lt.objs.editor.__GT_cm_ed.call(null,editor);var scroller = cm.getScrollerElement();return scroller.removeEventListener("mousedown",lt.plugins.lt_scrubber.mouse_down_fn);
});
lt.plugins.lt_scrubber.scrubber_on = (function scrubber_on(editor){cljs.core.print.call(null,"Scrubber On");
if(cljs.core.truth_(new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893).cljs$core$IFn$_invoke$arity$1(cljs.core.deref.call(null,editor))))
{} else
{lt.object.merge_BANG_.call(null,editor,new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893),lt.object.create.call(null,new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893),editor)], null));
}
lt.object.add_tags.call(null,editor,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"editor.scrubber.active","editor.scrubber.active",4278144421)], null));
lt.object.merge_BANG_.call(null,new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber","lt.plugins.lt-scrubber/scrubber",3857352893).cljs$core$IFn$_invoke$arity$1(cljs.core.deref.call(null,editor)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"active","active",3885920888),true], null));
var cm = lt.objs.editor.__GT_cm_ed.call(null,editor);var scroller = cm.getScrollerElement();return scroller.addEventListener("mousedown",lt.plugins.lt_scrubber.mouse_down_fn);
});
lt.plugins.lt_scrubber.__BEH__scrubber_toggle = (function __BEH__scrubber_toggle(editor){if(cljs.core.truth_(lt.object.has_tag_QMARK_.call(null,editor,new cljs.core.Keyword(null,"editor.scrubber.active","editor.scrubber.active",4278144421))))
{return lt.plugins.lt_scrubber.scrubber_off.call(null,editor);
} else
{return lt.plugins.lt_scrubber.scrubber_on.call(null,editor);
}
});
lt.object.behavior_STAR_.call(null,new cljs.core.Keyword("lt.plugins.lt-scrubber","scrubber-toggle","lt.plugins.lt-scrubber/scrubber-toggle",3399744256),new cljs.core.Keyword(null,"reaction","reaction",4441361819),lt.plugins.lt_scrubber.__BEH__scrubber_toggle,new cljs.core.Keyword(null,"desc","desc",1016984067),"Editor: Toggle scrubbing mode",new cljs.core.Keyword(null,"triggers","triggers",2516997421),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"scrubber.toggle!","scrubber.toggle!",2793734865),null], null), null));
lt.objs.command.command.call(null,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",1964298941),new cljs.core.Keyword("lt.plugins.lt-scrubber","toggle","lt.plugins.lt-scrubber/toggle",3252884849),new cljs.core.Keyword(null,"desc","desc",1016984067),"Editor: Toggle scrubbing mode",new cljs.core.Keyword(null,"exec","exec",1017031683),(function (){var temp__4092__auto__ = lt.objs.editor.pool.last_active.call(null);if(cljs.core.truth_(temp__4092__auto__))
{var ed = temp__4092__auto__;return lt.object.raise.call(null,ed,new cljs.core.Keyword(null,"scrubber.toggle!","scrubber.toggle!",2793734865));
} else
{return null;
}
})], null));
lt.plugins.lt_scrubber.__BEH__activate_scrubber = (function __BEH__activate_scrubber(editor){return lt.plugins.lt_scrubber.scrubber_on.call(null,editor);
});
lt.object.behavior_STAR_.call(null,new cljs.core.Keyword("lt.plugins.lt-scrubber","activate-scrubber","lt.plugins.lt-scrubber/activate-scrubber",3328866615),new cljs.core.Keyword(null,"reaction","reaction",4441361819),lt.plugins.lt_scrubber.__BEH__activate_scrubber,new cljs.core.Keyword(null,"desc","desc",1016984067),"Scrubber: Activate scrubbing mode",new cljs.core.Keyword(null,"triggers","triggers",2516997421),new cljs.core.PersistentHashSet(null, new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"object.instant","object.instant",773332388),null], null), null),new cljs.core.Keyword(null,"type","type",1017479852),new cljs.core.Keyword(null,"user","user",1017503549));
lt.objs.command.command.call(null,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",1964298941),new cljs.core.Keyword("lt.plugins.lt-scrubber","increment-value","lt.plugins.lt-scrubber/increment-value",3173857074),new cljs.core.Keyword(null,"desc","desc",1016984067),"Scrubber: Increment selected value",new cljs.core.Keyword(null,"exec","exec",1017031683),(function (){return lt.plugins.lt_scrubber.nudge.call(null,1);
})], null));
lt.objs.command.command.call(null,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"command","command",1964298941),new cljs.core.Keyword("lt.plugins.lt-scrubber","decrement-value","lt.plugins.lt-scrubber/decrement-value",4481278230),new cljs.core.Keyword(null,"desc","desc",1016984067),"Scrubber: Decrement selected value",new cljs.core.Keyword(null,"exec","exec",1017031683),(function (){return lt.plugins.lt_scrubber.nudge.call(null,-1);
})], null));
}

//# sourceMappingURL=scrubber_compiled.js.map