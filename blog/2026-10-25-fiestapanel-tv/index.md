---
title: "Give an existing screen a job with FiestaPanel"
description: "FiestaPanel turns a TV or screen with a web browser into a FiestaBoard display that follows the same pages and schedules as any other board."
slug: fiestapanel-tv
authors: [team]
tags: [announcement]
draft: true
---

Lots of homes have a screen that sits dark most of the day. FiestaPanel gives it a job: the weather, the next departures, a look at the day ahead, shown full screen and updated by FiestaBoard like any other display.

<!-- truncate -->

## How it works

FiestaBoard runs on a separate, always-on computer, such as a FiestaPi or a home server. The TV doesn't run FiestaBoard. It opens a panel address in its web browser and shows a full-screen board, drawn as split-flap flaps or as the dots of an LED sign.

To FiestaBoard, a panel is a virtual board. You can give it an active page, add it to schedules, and point plugins at it. The page editor's size picker lists your panels by name, so a page can be sized to fit that screen.

## Setting one up

Add a FiestaPanel display in FiestaBoard, name it, and enter the screen's diagonal size. FiestaBoard works out the largest board that fits with life-size flaps. Then open the panel's address in the TV's browser. The panel's page in the app shows that address, with a QR code and a copy button.

You need a smart TV, streaming stick, or other screen with a web browser that can open the panel. If the board looks the wrong size, **Size calibration** fine-tunes it.

## Keeping it current

Live updates need both ends running: the computer hosting FiestaBoard, and the TV with the panel open and connected. If the TV loses its connection, the last frame stays up with a small amber dot while the panel retries, so the screen may be out of date.

The panel asks the browser to keep the screen awake where it can, but TV sleep timers usually win. Turn off the TV's own screensaver or auto-off.

The [FiestaPanel guide](/docs/features/fiestapanel) covers every setting, and [TVs](/docs/displays/tv) has a quick setup summary. New to FiestaBoard? Start with [installation](/installation).
