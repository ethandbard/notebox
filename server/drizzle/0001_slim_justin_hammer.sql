-- SQLite requires a DEFAULT to add a NOT NULL column to a non-empty table.
-- This also backfills the one section that predates per-user ownership
-- (its only note was authored by ethan@thebardfamily.com). Every insert
-- from here on sets `owner` explicitly, so the default is a one-time
-- migration artifact, not a standing behavior.
ALTER TABLE `sections` ADD `owner` text NOT NULL DEFAULT 'ethan@thebardfamily.com';