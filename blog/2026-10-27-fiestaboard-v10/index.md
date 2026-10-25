---
title: "FiestaBoard v10: one app, more kinds of display"
description: "FiestaBoard v10 drives split-flap boards, the Divoom Pixoo 64 LED matrix, and TVs through a web browser, all from the same pages, plugins, and schedules."
slug: fiestaboard-v10
authors: [team]
tags: [release]
draft: true
---

FiestaBoard started as a dashboard for Vestaboard. With v10 it can drive three kinds of display: split-flap boards, LED matrices, and TVs. You still build pages, connect plugins, and set schedules in one app, and FiestaBoard draws each page the way the display in front of it needs: flaps for a split-flap board, pixels for an LED matrix, a life-size board for a TV.

<!-- truncate -->

## Three kinds of display

**Split-flap boards.** The Vestaboard Flagship, the Note, and Note arrays connect through Vestaboard's Local API on your network or its Cloud API. Nothing is installed on the board itself. FiestaBoard runs on a separate computer, such as a Raspberry Pi or a home server.

**LED matrices.** v10 adds the Divoom Pixoo 64. Once the Pixoo is set up in the Divoom app and on your Wi-Fi, FiestaBoard sends pages to it directly over your network, without Divoom's cloud. An LED matrix can show things a split-flap board can't, like colored text, lowercase letters, icons, and pixel art. Support covers the Pixoo 64 specifically, not other Divoom models. [LED matrix setup](/docs/displays/led-matrix)

**TVs.** A TV or screen with a web browser can open a FiestaPanel address and fill the screen with a board, drawn as split-flap flaps or as the dots of an LED sign. [TV setup](/docs/displays/tv)

## One app for every display

You can run several displays at once, and they don't have to match. A Vestaboard in the kitchen, a Pixoo on a desk, and a TV in the hallway can each show their own pages on their own schedules. Add hardware from **Displays → Add a display**.

Each display has its own grid, so a page made for a 22×6 Flagship won't automatically fill a Pixoo or a TV. The page editor's size picker lists your TVs and LED displays by name, so you can make a page for a specific screen in one step.

Behind the scenes, every display is an output plugin, the Vestaboard included. That's how FiestaBoard can support new hardware without changes to the app itself. It doesn't mean every LED panel works today: other hardware needs a compatible output plugin that has been tested on that device.

## What stays the same

If you already own a Vestaboard, it remains a first-class display in v10. FiestaBoard is still free, open-source software that you host yourself. Displays are hardware you buy separately.

Don't have a display yet? Choose **Skip — I'll add a display later** in the setup wizard, then build and preview pages in the app until one arrives. To get started, see [installation](/installation).
