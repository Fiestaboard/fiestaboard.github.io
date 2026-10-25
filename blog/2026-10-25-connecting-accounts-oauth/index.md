---
title: "Connect your accounts with OAuth"
description: "Some FiestaBoard plugins can connect to your account on another service through that service's own sign-in page, so you don't hand FiestaBoard your password."
slug: connecting-accounts-oauth
authors: [team]
tags: [announcement]
draft: true
---

Some plugins show things from an account you have on another service: what's playing, your next event, your latest order. Supported plugins can connect that account through the service's own sign-in page, so you don't hand FiestaBoard your account password.

<!-- truncate -->

If you haven't tried account sign-in yet, here's how it works.

## Connecting an account

Open **Integrations**, find the plugin, and open its settings. A plugin that supports this has an **Account connection** section at the top. Press **Sign in with** followed by the service's name, then sign in and approve access on the service's page. Some services show a short code instead, which you approve from your phone or another computer.

Not every plugin supports OAuth, and connecting isn't always one click. For some services you first create an app (sometimes called a client) in the service's developer settings, then enter its client ID, and sometimes a client secret, in the plugin's settings. The plugin's setup guide shows where to find them.

## Disconnecting

Open the plugin's settings and press **Disconnect**. FiestaBoard deletes the access it was holding for that plugin.

That doesn't remove FiestaBoard on the service's side. To take away its access there too, open your account settings on the service and remove FiestaBoard from its list of connected apps.

## FiestaBot can sign in too

FiestaBot, the optional AI assistant, can sign in to some AI providers the same way instead of using an API key. In **Settings → AI Providers**, the sign-in choices include ChatGPT, OpenRouter, and Hugging Face. API-key setups still work, and each provider's own terms and pricing apply.

The [Connecting Accounts guide](/docs/features/connecting-accounts) walks through each step and common problems, and the [AI Providers guide](/docs/setup/ai-providers) covers FiestaBot setup.
