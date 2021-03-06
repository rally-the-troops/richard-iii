"use strict";

const LANCASTER = "Lancaster";
const YORK = "York";
const REBEL = "Rebel";
const ENEMY = { York: "Lancaster", Lancaster: "York" }

const POOL = "Pool";
const DEAD = "Dead";
const MINOR = "Minor";

const KING_TEXT = "\u2756";
const PRETENDER_TEXT = "";

const LONG_NAME = {
	"Somerset": "Duke of Somerset",
	"Exeter": "Duke of Exeter",
	"Devon": "Earl of Devon",
	"Pembroke": "Earl of Pembroke",
	"Wiltshire": "Earl of Wiltshire",
	"Oxford": "Earl of Oxford",
	"Beaumont": "Viscount Beaumont",
	"Clifford": "Lord Clifford",
	"Buckingham": "Duke of Buckingham",
	"Northumberland": "Earl of Northumberland",
	"Shrewsbury": "Earl of Shrewsbury",
	"Westmoreland": "Earl of Westmoreland",
	"Rivers": "Lord Rivers",
	"Stanley": "Lord Stanley",
	"Richmond": "Earl of Richmond",
	"York": "Duke of York",
	"Rutland": "Earl of Rutland",
	"March": "Earl of March",
	"Warwick": "Earl of Warwick",
	"Salisbury": "Earl of Salisbury",
	"Kent": "Earl of Kent",
	"Norfolk": "Duke of Norfolk",
	"Suffolk": "Duke of Suffolk",
	"Arundel": "Earl of Arundel",
	"Essex": "Earl of Essex",
	"Worcester": "Earl of Worcester",
	"Hastings": "Lord Hastings",
	"Herbert": "Lord Herbert",
	"Clarence": "Duke of Clarence",
	"Gloucester": "Duke of Gloucester",
}

function toggle_blocks() {
	document.getElementById("map").classList.toggle("hide_blocks");
}

let ui = {
	cards: {},
	card_backs: {},
	areas: {},
	blocks: {},
	battle_menu: {},
	battle_block: {},
	present: new Set(),
}

function on_log(text) {
	let p = document.createElement("div");
	text = text.replace(/&/g, "&amp;");
	text = text.replace(/</g, "&lt;");
	text = text.replace(/>/g, "&gt;");

	text = text.replace(/\u2192 /g, "\u2192\xa0");

	text = text.replace(/^([A-Z]):/, '<span class="$1"> $1 </span>');

	if (text.match(/^Scenario: /)) {
		p.className = 'st', text = text.substring(10);
	} else if (text.match(/^~ .* ~$/)) {
		p.className = 'br', text = text.substring(2, text.length-2);
	} else if (text.match(/^Start Lancaster turn/)) {
		text = "Lancaster";
		p.className = 'L';
	} else if (text.match(/^Start York turn/)) {
		text = "York";
		p.className = 'Y';
	} else if (text.match(/^Start /)) {
		p.className = 'st', text = text.replace(/\.$/, "");
	} else if (text.match(/^Battle in/)) {
		text = text.substring(0,text.length-1);
		p.className = 'bs';
	}

	if (text.match(/^Start /))
		text = text.substring(6);

	p.innerHTML = text;
	return p;
}

function is_known_block(b) {
	if (view.game_over && player === 'Observer')
		return true;
	return block_owner(b) === player;
}

function on_focus_area(evt) {
	let where = evt.target.area;
	let text = where;
	if (AREAS[where].city)
		text += " (" + AREAS[where].city + ")";
	if (AREAS[where].crown)
		text += " - Crown"; // " \u2655";
	if (where === "South Yorks" || where === "Kent")
		text += " - Church"; // " -" \u2657";
	if (AREAS[where].major_port)
		text += " - Port";
	if (AREAS[where].shields.length > 0)
		text += " - " + AREAS[where].shields.join(", ");
	document.getElementById("status").textContent = text;
}

function on_blur_area(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_area(evt) {
	let where = evt.target.area;
	send_action('area', where);
}

const STEP_TEXT = [ 0, "I", "II", "III", "IIII" ];
const HEIR_TEXT = [ 0, '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075' ];

function block_name(who) {
	if (!who) return "Nobody";
	let name = BLOCKS[who].name;
	let long_name = LONG_NAME[name];
	return long_name ? long_name : name;
}

function block_owner(who) {
	if (who === REBEL) {
		if (view.pretender)
			return BLOCKS[view.pretender].owner;
		if (view.king)
			return ENEMY[BLOCKS[view.king].owner];
		return YORK;
	}
	return BLOCKS[who].owner;
}

function on_focus_map_block(evt) {
	let b = evt.target.block;
	if (is_known_block(b)) {
		let s = BLOCKS[b].steps;
		let text = block_name(b) + " ";
		if (BLOCKS[b].type === 'heir')
			text += "H" + HEIR_TEXT[BLOCKS[b].heir] + "-";
		if (BLOCKS[b].loyalty)
			text += BLOCKS[b].loyalty + "-";
		else if (BLOCKS[b].type === 'nobles')
			text += "\u2740-";
		text += STEP_TEXT[s] + "-" + BLOCKS[b].combat;
		document.getElementById("status").textContent = text;
	} else {
		let owner = block_owner(b);
		if (b === REBEL)
			owner = "Rebel";
		document.getElementById("status").textContent = owner;
	}
}

function on_blur_map_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_map_block(evt) {
	let b = evt.target.block;
	if (!view.battle)
		send_action('block', b);
}

function on_focus_battle_block(evt) {
	let b = evt.target.block;
	let msg = block_name(b);
	if (view.battle.LR.includes(b))
		msg = "Lancaster Reserve";
	if (view.battle.YR.includes(b))
		msg = "York Reserve";

	if (view.actions && view.actions.battle_fire && view.actions.battle_fire.includes(b))
		msg = "Fire with " + msg;
	else if (view.actions && view.actions.battle_retreat && view.actions.battle_retreat.includes(b))
		msg = "Retreat with " + msg;
	else if (view.actions && view.actions.battle_charge && view.actions.battle_charge.includes(b))
		msg = "Charge " + msg;
	else if (view.actions && view.actions.battle_treachery && view.actions.battle_treachery.includes(b))
		msg = "Attempt treachery on " + msg;
	else if (view.actions && view.actions.battle_hit && view.actions.battle_hit.includes(b))
		msg = "Take hit on " + msg;

	document.getElementById("status").textContent = msg;
}

function on_blur_battle_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_block(evt) {
	let b = evt.target.block;
	send_action('block', b);
}

function on_focus_battle_fire(evt) {
	document.getElementById("status").textContent =
		"Fire with " + block_name(evt.target.block);
}

function on_focus_battle_retreat(evt) {
	document.getElementById("status").textContent =
		"Retreat with " + block_name(evt.target.block);
}

function on_focus_battle_pass(evt) {
	document.getElementById("status").textContent =
		"Pass with " + block_name(evt.target.block);
}

function on_focus_battle_hit(evt) {
	document.getElementById("status").textContent =
		"Take hit on " + block_name(evt.target.block);
}

function on_focus_battle_charge(evt) {
	if (block_owner(evt.target.block) === view.active)
		document.getElementById("status").textContent =
			"Charge with " + block_name(evt.target.block);
	else
		document.getElementById("status").textContent =
			"Charge " + block_name(evt.target.block);
}

function on_focus_battle_treachery(evt) {
	if (block_owner(evt.target.block) === view.active)
		document.getElementById("status").textContent =
			"Attempt treachery with " + block_name(evt.target.block);
	else
		document.getElementById("status").textContent =
			"Attempt treachery on " + block_name(evt.target.block);
}

function on_blur_battle_button(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_hit(evt) { send_action('battle_hit', evt.target.block); }
function on_click_battle_fire(evt) { send_action('battle_fire', evt.target.block); }
function on_click_battle_retreat(evt) { send_action('battle_retreat', evt.target.block); }
function on_click_battle_charge(evt) { send_action('battle_charge', evt.target.block); }
function on_click_battle_treachery(evt) { send_action('battle_treachery', evt.target.block); }

function on_click_battle_pass(evt) {
	if (window.confirm("Are you sure that you want to PASS with " + block_name(evt.target.block) + "?"))
		send_action('battle_pass', evt.target.block);
}

function on_click_card(evt) {
	let c = evt.target.id.split("+")[1] | 0;
	send_action('play', c);
}

function build_battle_button(menu, b, c, click, enter, img_src) {
	let img = new Image();
	img.draggable = false;
	img.classList.add("action");
	img.classList.add(c);
	img.setAttribute("src", img_src);
	img.addEventListener("click", click);
	img.addEventListener("mouseenter", enter);
	img.addEventListener("mouseleave", on_blur_battle_button);
	img.block = b;
	menu.appendChild(img);
}

function build_battle_block(b, block) {
	let element = document.createElement("div");
	element.classList.add("block");
	element.classList.add("known");
	element.classList.add(BLOCKS[b].owner);
	element.classList.add("block_" + block.image);
	element.addEventListener("mouseenter", on_focus_battle_block);
	element.addEventListener("mouseleave", on_blur_battle_block);
	element.addEventListener("click", on_click_battle_block);
	element.block = b;
	ui.battle_block[b] = element;

	let menu_list = document.createElement("div");
	menu_list.classList.add("battle_menu_list");

	build_battle_button(menu_list, b, "treachery",
		on_click_battle_treachery, on_focus_battle_treachery,
		"/images/rose.svg");
	build_battle_button(menu_list, b, "charge",
		on_click_battle_charge, on_focus_battle_charge,
		"/images/mounted-knight.svg");
	build_battle_button(menu_list, b, "hit",
		on_click_battle_hit, on_focus_battle_hit,
		"/images/cross-mark.svg");

	// menu_list.appendChild(document.createElement("br"));

	build_battle_button(menu_list, b, "fire",
		on_click_battle_fire, on_focus_battle_fire,
		"/images/pointy-sword.svg");
	build_battle_button(menu_list, b, "retreat",
		on_click_battle_retreat, on_focus_battle_retreat,
		"/images/flying-flag.svg");
	build_battle_button(menu_list, b, "pass",
		on_click_battle_pass, on_focus_battle_pass,
		"/images/sands-of-time.svg");

	let menu = document.createElement("div");
	menu.classList.add("battle_menu");
	menu.appendChild(element);
	menu.appendChild(menu_list);
	menu.block = b;
	ui.battle_menu[b] = menu;
}

function build_map_block(b, block) {
	let element = document.createElement("div");
	element.classList.add("block");
	element.classList.add("known");
	element.classList.add(BLOCKS[b].owner);
	element.classList.add("block_" + block.image);
	element.addEventListener("mouseenter", on_focus_map_block);
	element.addEventListener("mouseleave", on_blur_map_block);
	element.addEventListener("click", on_click_map_block);
	element.block = b;
	ui.blocks[b] = element;
}

function build_map() {
	let element;

	ui.blocks_element = document.getElementById("blocks");
	ui.offmap_element = document.getElementById("offmap");

	for (let c = 1; c <= 25; ++c) {
		ui.cards[c] = document.getElementById("card+"+c);
		ui.cards[c].addEventListener("click", on_click_card);
	}

	for (let c = 1; c <= 7; ++c)
		ui.card_backs[c] = document.getElementById("back+"+c);

	for (let name in AREAS) {
		let area = AREAS[name];
		element = document.getElementById("svgmap").getElementById("area_"+name.replace(/ /g, "_"));
		if (element) {
			element.area = name;
			element.addEventListener("mouseenter", on_focus_area);
			element.addEventListener("mouseleave", on_blur_area);
			element.addEventListener("click", on_click_area);
			ui.areas[name] = element;
		}
	}

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		build_battle_block(b, block);
		build_map_block(b, block);
	}
}

function update_steps(b, steps, element) {
	element.classList.remove("r1");
	element.classList.remove("r2");
	element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[b].steps - steps));
}

function layout_blocks(area, secret, known) {
	let wrap = AREAS[area].wrap;
	let s = secret.length;
	let k = known.length;
	let n = s + k;
	let row, rows = [];
	let i = 0;

	function new_line() {
		rows.push(row = []);
		i = 0;
	}

	new_line();

	while (secret.length > 0) {
		if (i === wrap)
			new_line();
		row.push(secret.shift());
		++i;
	}

	// Break early if secret and known fit in exactly two rows, and more than three blocks total
	if (s > 0 && s <= wrap && k > 0 && k <= wrap && n > 3)
		new_line();

	while (known.length > 0) {
		if (i === wrap)
			new_line();
		row.push(known.shift());
		++i;
	}

	if (AREAS[area].layout_minor > 0.5)
		rows.reverse();

	for (let j = 0; j < rows.length; ++j)
		for (i = 0; i < rows[j].length; ++i)
			position_block(area, j, rows.length, i, rows[j].length, rows[j][i]);
}

function position_block(area, row, n_rows, col, n_cols, element) {
	let space = AREAS[area];
	let block_size = 60+6;
	let padding = 4;
	let offset = block_size + padding;
	let row_size = (n_rows-1) * offset;
	let col_size = (n_cols-1) * offset;
	let x = space.x - block_size/2;
	let y = space.y - block_size/2;

	if (space.layout_axis === 'X') {
		x -= col_size * space.layout_major;
		y -= row_size * space.layout_minor;
		x += col * offset;
		y += row * offset;
	} else {
		y -= col_size * space.layout_major;
		x -= row_size * space.layout_minor;
		y += col * offset;
		x += row * offset;
	}

	element.style.left = (x|0)+"px";
	element.style.top = (y|0)+"px";
}

function show_block(element) {
	if (element.parentElement !== ui.blocks_element)
		ui.blocks_element.appendChild(element);
}

function hide_block(element) {
	if (element.parentElement !== ui.offmap_element)
		ui.offmap_element.appendChild(element);
}

function is_dead(who) {
	return view.location[who] === null;
}

function is_perma_dead(who) {
	if (BLOCKS[who].loyalty === undefined)
		return true;
	switch (who) {
	case "Warwick/Y": return is_dead("Warwick/L") && is_dead("Warwick/Y");
	case "Kent/Y": return is_dead("Kent/L") && is_dead("Kent/Y");
	case "Salisbury/Y": return is_dead("Salisbury/L") && is_dead("Salisbury/Y");
	case "Clarence/Y": return is_dead("Clarence/L") && is_dead("Clarence/Y");
	case "Exeter/L": return is_dead("Exeter/L") && is_dead("Exeter/Y");
	}
	return false;
}

function update_map() {
	let overflow = { Lancaster: [], York: [], Rebel: [] };
	let layout = {};

	document.getElementById("turn_info").textContent =
		"Campaign " + view.campaign +
		"\nKing: " + block_name(view.king) +
		"\nPretender: " + block_name(view.pretender);

	layout[DEAD] = { Lancaster: [], York: [] };
	for (let area in AREAS)
		layout[area] = { Lancaster: [], York: [] };

	for (let b in view.location) {
		let info = BLOCKS[b];
		let element = ui.blocks[b];
		let area = view.location[b];
		let moved = view.moved[b] ? " moved" : "";
		let image = " block_" + info.image;
		let steps = " r" + (info.steps - view.steps[b]);
		let known = is_known_block(b);

		// perma-dead nobles
		if (area === null && is_perma_dead(b)) {
			area = DEAD;
			moved = " moved";
			known = 1;
			steps = "";
		}

		if (area !== null) {
			if (known) {
				element.classList = info.owner + " known block" + image + steps + moved;
			} else {
				element.classList = info.owner + " block" + moved;
			}
			if (block_owner(b) === LANCASTER)
				layout[area].Lancaster.push(element);
			else
				layout[area].York.push(element);
			show_block(element);
		} else {
			hide_block(element);
		}
	}

	for (let area in AREAS) {
		if (area === POOL) {
			layout_blocks("LPool", layout[POOL].Lancaster, layout[DEAD].Lancaster);
			layout_blocks("YPool", layout[POOL].York, layout[DEAD].York);
		} else if (area === MINOR) {
			layout_blocks("LMinor", layout[area].Lancaster, []);
			layout_blocks("YMinor", layout[area].York, []);
		} else {
			layout_blocks(area, layout[area].Lancaster, layout[area].York);
		}
	}

	for (let where in AREAS) {
		if (ui.areas[where]) {
			ui.areas[where].classList.remove('highlight');
			ui.areas[where].classList.remove('where');
		}
	}
	if (view.actions && view.actions.area)
		for (let where of view.actions.area)
			ui.areas[where].classList.add('highlight');
	if (view.where)
		ui.areas[view.where].classList.add('where');

	for (let b in BLOCKS) {
		ui.blocks[b].classList.remove('highlight');
		ui.blocks[b].classList.remove('selected');
	}
	if (!view.battle) {
		if (view.actions && view.actions.block)
			for (let b of view.actions.block)
				ui.blocks[b].classList.add('highlight');
		if (view.who)
			ui.blocks[view.who].classList.add('selected');
	}
}

function update_cards() {
	let cards = view.hand;
	for (let c = 1; c <= 25; ++c) {
		ui.cards[c].classList.remove('enabled');
		if (cards && cards.includes(c))
			ui.cards[c].classList.add('show');
		else
			ui.cards[c].classList.remove('show');
	}

	let n = view.hand.length;
	for (let c = 1; c <= 7; ++c)
		if (c <= n && player === 'Observer')
			ui.card_backs[c].classList.add("show");
		else
			ui.card_backs[c].classList.remove("show");

	if (view.actions && view.actions.play) {
		for (let c of view.actions.play)
			ui.cards[c].classList.add('enabled');
	}

	if (!view.l_card)
		document.getElementById("lancaster_card").className = "show card card_back";
	else
		document.getElementById("lancaster_card").className = "show card " + CARDS[view.l_card].image;
	if (!view.y_card)
		document.getElementById("york_card").className = "show card card_back";
	else
		document.getElementById("york_card").className = "show card " + CARDS[view.y_card].image;
}

function compare_blocks(a, b) {
	let aa = BLOCKS[a].combat;
	let bb = BLOCKS[b].combat;
	// Bombard
	if (aa === "D3" && view.battle.round <= 1) aa = "A3";
	if (bb === "D3" && view.battle.round <= 1) bb = "A3";
	if (aa === bb)
		return (a < b) ? -1 : (a > b) ? 1 : 0;
	return (aa < bb) ? -1 : (aa > bb) ? 1 : 0;
}

function sort_battle_row(root) {
	let swapped;
	let children = root.children;
	do {
		swapped = false;
		for (let i = 1; i < children.length; ++i) {
			if (compare_blocks(children[i-1].block, children[i].block) > 0) {
				children[i].after(children[i-1]);
				swapped = true;
			}
		}
	} while (swapped);
}

function update_battle() {
	function fill_cell(name, list, reserve) {
		let cell = window[name];

		ui.present.clear();

		for (let block of list) {
			ui.present.add(block);

			if (!cell.contains(ui.battle_menu[block]))
				cell.appendChild(ui.battle_menu[block]);

			if (block === view.who)
				ui.battle_block[block].classList.add("selected");
			else
				ui.battle_block[block].classList.remove("selected");

			ui.battle_block[block].classList.remove("highlight");
			ui.battle_menu[block].classList.remove('hit');
			ui.battle_menu[block].classList.remove('fire');
			ui.battle_menu[block].classList.remove('retreat');
			ui.battle_menu[block].classList.remove('pass');
			ui.battle_menu[block].classList.remove('charge');
			ui.battle_menu[block].classList.remove('treachery');

			if (view.actions && view.actions.block && view.actions.block.includes(block))
				ui.battle_block[block].classList.add("highlight");
			if (view.actions && view.actions.battle_fire && view.actions.battle_fire.includes(block))
				ui.battle_menu[block].classList.add('fire');
			if (view.actions && view.actions.battle_retreat && view.actions.battle_retreat.includes(block))
				ui.battle_menu[block].classList.add('retreat');
			if (view.actions && view.actions.battle_pass && view.actions.battle_pass.includes(block))
				ui.battle_menu[block].classList.add('pass');
			if (view.actions && view.actions.battle_hit && view.actions.battle_hit.includes(block))
				ui.battle_menu[block].classList.add('hit');
			if (view.actions && view.actions.battle_charge && view.actions.battle_charge.includes(block))
				ui.battle_menu[block].classList.add('charge');
			if (view.actions && view.actions.battle_treachery && view.actions.battle_treachery.includes(block))
				ui.battle_menu[block].classList.add('treachery');

			update_steps(block, view.steps[block], ui.battle_block[block]);
			if (reserve)
				ui.battle_block[block].classList.add("secret");
			else
				ui.battle_block[block].classList.remove("secret");
			if (view.moved[block])
				ui.battle_block[block].classList.add("moved");
			else
				ui.battle_block[block].classList.remove("moved");
			if (reserve)
				ui.battle_block[block].classList.remove("known");
			else
				ui.battle_block[block].classList.add("known");
		}

		for (let b in BLOCKS) {
			if (!ui.present.has(b)) {
				if (cell.contains(ui.battle_menu[b]))
					cell.removeChild(ui.battle_menu[b]);
			}
		}

		sort_battle_row(cell);
	}

	if (player === LANCASTER) {
		fill_cell("FR", view.battle.LR, true);
		fill_cell("FF", view.battle.LF, false);
		fill_cell("EF", view.battle.YF, false);
		fill_cell("ER", view.battle.YR, true);
	} else {
		fill_cell("ER", view.battle.LR, true);
		fill_cell("EF", view.battle.LF, false);
		fill_cell("FF", view.battle.YF, false);
		fill_cell("FR", view.battle.YR, true);
	}
}

function on_update() {
	let king = block_owner(view.king);
	document.getElementById("lancaster_vp").textContent = (king === LANCASTER ? KING_TEXT : PRETENDER_TEXT);
	document.getElementById("york_vp").textContent = (king === YORK ? KING_TEXT : PRETENDER_TEXT);

	action_button("eliminate", "Eliminate");
	action_button("execute_clarence", "Execute Clarence");
	action_button("execute_exeter", "Execute Exeter");
	action_button("end_action_phase", "End action phase");
	action_button("end_supply_phase", "End supply phase");
	action_button("end_political_turn", "End political turn");
	action_button("end_exile_limits", "End exile limits");
	action_button("end_regroup", "End regroup");
	action_button("end_retreat", "End retreat");
	action_button("pass", "Pass");
	action_button("undo", "Undo");

	update_cards();
	update_map();

	if (view.battle) {
		document.getElementById("battle_header").textContent = view.battle.title;
		document.getElementById("battle_message").textContent = view.battle.flash;
		document.getElementById("battle").classList.add("show");
		update_battle();
	} else {
		document.getElementById("battle").classList.remove("show");
	}
}

build_map();

drag_element_with_mouse("#battle", "#battle_header");
scroll_with_middle_mouse("main", 2);
