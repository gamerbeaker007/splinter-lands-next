-- Land card collection weekly scan table

CREATE TABLE "player_card_edition_summary" (
    "date"                DATE    NOT NULL,
    "player"              TEXT    NOT NULL,
    "card_set"            TEXT    NOT NULL,
    "total_cards"         INTEGER NOT NULL,
    "foil_regular"        INTEGER NOT NULL,
    "foil_gold"           INTEGER NOT NULL,
    "foil_gold_arcane"    INTEGER NOT NULL,
    "foil_black"          INTEGER NOT NULL,
    "foil_black_arcane"   INTEGER NOT NULL,
    "land_base_pp"        INTEGER NOT NULL,
    "owned"               INTEGER NOT NULL,
    "rented"              INTEGER NOT NULL,
    "delegated"           INTEGER NOT NULL,
    "rarity_level_counts" JSONB   NOT NULL,
    CONSTRAINT "player_card_edition_summary_pkey" PRIMARY KEY ("date","player","card_set")
);
