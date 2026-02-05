-- ═══════════════════════════════════════════════════════════════
-- MANIFOLD QR ENCODING SCHEMA
-- The Fractal Trio: Element → Action → Emission + API Bridge
-- 
-- Turso (libSQL) compatible
-- Prime factorization encodes all UI physics
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- LAYER 0: THE PERIODIC TABLE
-- Primes assigned to every physics value. NEVER changes.
-- This IS the shared function. The codon table.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE physics_primes (
    axis        TEXT NOT NULL,   -- 'density', 'temperature', 'mass', 'charge', 'friction', 'pressure', 'buoyancy'
    value       TEXT NOT NULL,   -- 'solid', 'warm', '1.0', etc.
    prime       INTEGER NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (axis, value)
);

-- THE ASSIGNMENTS (from our count)
-- Density: 5 states
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('density', 'void',   2,  0),
    ('density', 'gas',    3,  1),
    ('density', 'liquid', 5,  2),
    ('density', 'solid',  7,  3),
    ('density', 'dense',  11, 4);

-- Temperature: 6 states
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('temperature', 'void',     13, 0),
    ('temperature', 'cold',     17, 1),
    ('temperature', 'warm',     19, 2),
    ('temperature', 'hot',      23, 3),
    ('temperature', 'critical', 29, 4),
    ('temperature', 'fusion',   31, 5);

-- Mass: 18 distinct values
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('mass', '-0.5', 37,  0),
    ('mass', '-0.3', 41,  1),
    ('mass', '-0.2', 43,  2),
    ('mass', '0.0',  47,  3),
    ('mass', '0.1',  53,  4),
    ('mass', '0.2',  59,  5),
    ('mass', '0.3',  61,  6),
    ('mass', '0.4',  67,  7),
    ('mass', '0.5',  71,  8),
    ('mass', '0.6',  73,  9),
    ('mass', '0.7',  79,  10),
    ('mass', '0.8',  83,  11),
    ('mass', '0.9',  89,  12),
    ('mass', '1.0',  97,  13),
    ('mass', '1.2',  101, 14),
    ('mass', '1.3',  103, 15),
    ('mass', '1.5',  107, 16),
    ('mass', '2.0',  109, 17);

-- Charge: 9 distinct values + absent
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('charge', '0.1',  113, 0),
    ('charge', '0.2',  127, 1),
    ('charge', '0.4',  131, 2),
    ('charge', '0.5',  137, 3),
    ('charge', '0.6',  139, 4),
    ('charge', '0.8',  149, 5),
    ('charge', '5',    151, 6),
    ('charge', '10',   157, 7),
    ('charge', '15',   163, 8);

-- Friction: 5 distinct values
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('friction', '0.2', 167, 0),
    ('friction', '0.3', 173, 1),
    ('friction', '0.5', 179, 2),
    ('friction', '0.8', 181, 3),
    ('friction', '1.5', 191, 4);

-- Pressure: 3 distinct values
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('pressure', '0',   193, 0),
    ('pressure', '1.0', 197, 1),
    ('pressure', '2.0', 199, 2);

-- Buoyancy: 2 distinct values
INSERT INTO physics_primes (axis, value, prime, sort_order) VALUES
    ('buoyancy', '0.0', 211, 0),
    ('buoyancy', '1.0', 223, 1);


-- ─────────────────────────────────────────────────────────────
-- LAYER 1: ELEMENT (Line 1 of the Fractal Trio)
-- "What IS it" — the prime-encoded component
-- ─────────────────────────────────────────────────────────────

CREATE TABLE element_types (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,  -- 'Button', 'Card', 'Text', 'Navbar', etc.
    prime_id    INTEGER NOT NULL UNIQUE -- each TYPE also gets a prime for tree encoding
);

-- Component types get their own primes (starting after physics primes)
-- These encode WHAT something is in the tree structure
INSERT INTO element_types (id, name, prime_id) VALUES
    (0,  'Container', 227),
    (1,  'Text',      229),
    (2,  'Button',    233),
    (3,  'Card',      239),
    (4,  'Input',     241),
    (5,  'Badge',     251),
    (6,  'Modal',     257),
    (7,  'Sidebar',   263),
    (8,  'Navbar',    269),
    (9,  'Table',     271),
    (10, 'List',      277),
    (11, 'Toast',     281),
    (12, 'Progress',  283),
    (13, 'Avatar',    293),
    (14, 'Image',     307),
    (15, 'Link',      311),
    (16, 'Pill',      313),
    (17, 'Slider',    317),
    (18, 'Spacer',    331),
    (19, 'Spinner',   337);

CREATE TABLE element_variants (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    element_type_id INTEGER NOT NULL REFERENCES element_types(id),
    variant_name    TEXT NOT NULL,           -- 'default', 'primary', 'ghost', etc.
    physics_product INTEGER NOT NULL,        -- THE PRIME PRODUCT (e.g. 12901 = solid*warm*mass1.0)
    UNIQUE(element_type_id, variant_name)
);

-- Example: Button variants
-- Button.default  = solid(7) * cold(17) * mass0.8(83)     = 9877
-- Button.primary  = solid(7) * warm(19) * mass1.0(97)     = 12901
-- Button.ghost    = gas(3) * cold(17) * mass0.3(61)       = 3111
-- Button.danger   = solid(7) * critical(29) * mass1.0(97) = 19691
INSERT INTO element_variants (element_type_id, variant_name, physics_product) VALUES
    (2, 'default',   7 * 17 * 83),
    (2, 'primary',   7 * 19 * 97),
    (2, 'secondary', 5 * 17 * 73),
    (2, 'ghost',     3 * 17 * 61),
    (2, 'danger',    7 * 29 * 97),
    (2, 'success',   7 * 19 * 97),
    (2, 'disabled',  7 * 17 * 71 * 191);

-- Card variants
INSERT INTO element_variants (element_type_id, variant_name, physics_product) VALUES
    (3, 'default',   7 * 17 * 97),
    (3, 'elevated',  11 * 17 * 107),
    (3, 'floating',  7 * 19 * 41),
    (3, 'glass',     5 * 17 * 73),
    (3, 'outlined',  3 * 17 * 83),
    (3, 'danger',    7 * 29 * 97),
    (3, 'success',   7 * 19 * 97),
    (3, 'highlight', 7 * 31 * 101);

-- Text variants
INSERT INTO element_variants (element_type_id, variant_name, physics_product) VALUES
    (1, 'default', 3 * 61),
    (1, 'heading', 7 * 83),
    (1, 'label',   3 * 59),
    (1, 'caption', 3 * 53),
    (1, 'code',    5 * 67),
    (1, 'error',   3 * 29 * 67),
    (1, 'success', 3 * 19 * 67);

-- Navbar variants
INSERT INTO element_variants (element_type_id, variant_name, physics_product) VALUES
    (8, 'default', 11 * 17 * 101),
    (8, 'glass',   5 * 17 * 97),
    (8, 'solid',   7 * 17 * 107);

-- Badge variants
INSERT INTO element_variants (element_type_id, variant_name, physics_product) VALUES
    (5, 'default', 7 * 17 * 71),
    (5, 'info',    7 * 19 * 71),
    (5, 'success', 7 * 19 * 71),
    (5, 'warning', 7 * 23 * 71),
    (5, 'danger',  7 * 29 * 71),
    (5, 'premium', 7 * 31 * 71);


-- ─────────────────────────────────────────────────────────────
-- LAYER 2: ACTIONS (Line 2 of the Fractal Trio)
-- "What can the user DO" — interaction vocabulary
-- ─────────────────────────────────────────────────────────────

CREATE TABLE action_types (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    prime   INTEGER NOT NULL UNIQUE  -- actions get primes too
);

-- Actions are finite. These cover virtually all mobile interactions.
INSERT INTO action_types (id, name, prime) VALUES
    (0,  'tap',         347),
    (1,  'long_press',  349),
    (2,  'swipe_left',  353),
    (3,  'swipe_right', 359),
    (4,  'swipe_up',    367),
    (5,  'swipe_down',  373),
    (6,  'pinch',       379),
    (7,  'spread',      383),
    (8,  'type_text',   389),
    (9,  'select',      397),
    (10, 'toggle',      401),
    (11, 'drag',        409),
    (12, 'scroll',      419),
    (13, 'submit',      421);

-- Which elements accept which actions
CREATE TABLE element_actions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    element_type_id INTEGER NOT NULL REFERENCES element_types(id),
    variant_name    TEXT,                                          -- NULL = all variants
    action_type_id  INTEGER NOT NULL REFERENCES action_types(id),
    action_product  INTEGER NOT NULL  -- element_prime * action_prime = unique interaction
);

-- Button accepts: tap
INSERT INTO element_actions (element_type_id, variant_name, action_type_id, action_product) VALUES
    (2, NULL, 0, 233 * 347);  -- Button.* tap = 80851

-- Card accepts: tap, swipe_left (dismiss), long_press (options)
INSERT INTO element_actions (element_type_id, variant_name, action_type_id, action_product) VALUES
    (3, NULL, 0, 239 * 347),   -- Card.* tap
    (3, NULL, 2, 239 * 353),   -- Card.* swipe_left
    (3, NULL, 1, 239 * 349);   -- Card.* long_press

-- Input accepts: tap (focus), type_text, submit
INSERT INTO element_actions (element_type_id, variant_name, action_type_id, action_product) VALUES
    (4, NULL, 0, 241 * 347),   -- Input.* tap
    (4, NULL, 8, 241 * 389),   -- Input.* type_text
    (4, NULL, 13, 241 * 421);  -- Input.* submit

-- List accepts: scroll, tap (select item)
INSERT INTO element_actions (element_type_id, variant_name, action_type_id, action_product) VALUES
    (10, NULL, 12, 277 * 419), -- List.* scroll
    (10, NULL, 0,  277 * 347); -- List.* tap


-- ─────────────────────────────────────────────────────────────
-- LAYER 3: EMISSIONS (Line 3 of the Fractal Trio)
-- "How the element ANSWERS" — response vocabulary
-- ─────────────────────────────────────────────────────────────

CREATE TABLE emission_types (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    prime   INTEGER NOT NULL UNIQUE
);

-- Emissions: what the component SAYS when interacted with
INSERT INTO emission_types (id, name, prime) VALUES
    (0,  'navigate',        431),  -- go to another view
    (1,  'add_to_cart',     433),  -- item added
    (2,  'remove_from_cart', 439), -- item removed
    (3,  'increment',       443),  -- count +1
    (4,  'decrement',       449),  -- count -1
    (5,  'toggle_state',    457),  -- flip boolean
    (6,  'show_modal',      461),  -- open overlay
    (7,  'dismiss',         463),  -- close/hide
    (8,  'submit_form',     467),  -- send data
    (9,  'select_item',     479),  -- choose from list
    (10, 'expand',          487),  -- show more
    (11, 'collapse',        491),  -- show less
    (12, 'play',            499),  -- start media
    (13, 'pause',           503),  -- stop media
    (14, 'update_value',    509),  -- change a field
    (15, 'emit_to_api',     521);  -- bridge to external (Line 4)

-- What each action on each element EMITS
CREATE TABLE action_emissions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    element_action_id INTEGER NOT NULL REFERENCES element_actions(id),
    emission_type_id  INTEGER NOT NULL REFERENCES emission_types(id),
    target_ref        TEXT,     -- what receives the emission (element ref or 'api')
    emission_product  INTEGER NOT NULL  -- action_product * emission_prime
);


-- ─────────────────────────────────────────────────────────────
-- LAYER 4: API BRIDGE (Line 4 — the external connection)
-- One line. Where the app touches reality.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE api_bridges (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id      INTEGER NOT NULL REFERENCES apps(id),
    endpoint    TEXT NOT NULL,       -- 'https://kitchen.restaurant.com/orders'
    method      TEXT NOT NULL DEFAULT 'POST',  -- HTTP method
    auth_type   TEXT,                -- 'bearer', 'api_key', 'none'
    auth_ref    TEXT,                -- where to get the token (local storage key, etc.)
    payload_map TEXT NOT NULL        -- JSON: maps emission fields to API fields
);


-- ─────────────────────────────────────────────────────────────
-- APP STRUCTURE: The complete QR-encoded application
-- ─────────────────────────────────────────────────────────────

CREATE TABLE apps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    cuisine_type    TEXT,             -- for restaurant apps: 'brazilian', 'japanese', etc.
    locale          TEXT NOT NULL DEFAULT 'pt-BR',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    seed            BLOB              -- the final QR seed (prime products + tree + content)
);

-- The component tree: how elements nest
CREATE TABLE app_tree (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id          INTEGER NOT NULL REFERENCES apps(id),
    node_index      INTEGER NOT NULL,  -- position in tree (reading order = time)
    parent_index    INTEGER,           -- NULL = root
    element_type_id INTEGER NOT NULL REFERENCES element_types(id),
    variant_name    TEXT NOT NULL DEFAULT 'default',
    content_key     TEXT,              -- reference to content table for text
    sort_order      INTEGER NOT NULL DEFAULT 0,
    UNIQUE(app_id, node_index)
);

-- The ONLY irreducible data: human-readable text content
CREATE TABLE app_content (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id      INTEGER NOT NULL REFERENCES apps(id),
    content_key TEXT NOT NULL,         -- referenced by app_tree
    value       TEXT NOT NULL,         -- the actual words
    locale      TEXT NOT NULL DEFAULT 'pt-BR',
    UNIQUE(app_id, content_key, locale)
);

-- ─────────────────────────────────────────────────────────────
-- VIEWS: Useful queries
-- ─────────────────────────────────────────────────────────────

-- Full element decode: number → physics
CREATE VIEW decode_element AS
SELECT 
    ev.physics_product,
    et.name AS element,
    ev.variant_name AS variant,
    GROUP_CONCAT(pp.axis || ':' || pp.value, ', ') AS physics
FROM element_variants ev
JOIN element_types et ON ev.element_type_id = et.id
LEFT JOIN physics_primes pp ON ev.physics_product % pp.prime = 0
GROUP BY ev.id;

-- Full app topology: tree + content + physics in one view
CREATE VIEW app_topology AS
SELECT 
    at2.app_id,
    at2.node_index,
    at2.parent_index,
    et.name AS element,
    at2.variant_name AS variant,
    ev.physics_product,
    ac.value AS content,
    ac.locale
FROM app_tree at2
JOIN element_types et ON at2.element_type_id = et.id
LEFT JOIN element_variants ev ON ev.element_type_id = at2.element_type_id 
    AND ev.variant_name = at2.variant_name
LEFT JOIN app_content ac ON ac.app_id = at2.app_id 
    AND ac.content_key = at2.content_key;

-- The fractal trio for any element
CREATE VIEW fractal_trio AS
SELECT
    et.name AS element,
    ev.variant_name AS variant,
    ev.physics_product AS line_1_element,
    GROUP_CONCAT(DISTINCT act.name) AS line_2_actions,
    GROUP_CONCAT(DISTINCT emt.name) AS line_3_emissions
FROM element_types et
JOIN element_variants ev ON ev.element_type_id = et.id
LEFT JOIN element_actions ea ON ea.element_type_id = et.id 
    AND (ea.variant_name IS NULL OR ea.variant_name = ev.variant_name)
LEFT JOIN action_types act ON ea.action_type_id = act.id
LEFT JOIN action_emissions ae ON ae.element_action_id = ea.id
LEFT JOIN emission_types emt ON ae.emission_type_id = emt.id
GROUP BY et.name, ev.variant_name;