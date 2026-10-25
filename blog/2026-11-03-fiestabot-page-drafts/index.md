---
title: "A first draft for your display, with FiestaBot"
description: "FiestaBot, FiestaBoard's optional AI assistant, drafts a page from a plain-language request using an AI provider you connect, and you finish it in the page editor."
slug: fiestabot-page-drafts
authors: [team]
tags: [announcement]
draft: true
---

A blank grid can be the hardest part of making a page. FiestaBot, FiestaBoard's optional AI assistant, gives you a starting point: describe the page you want in plain language and it drafts one for you. Without it, the page editor works the same way.

<!-- truncate -->

## Start with a request

Once you've connected a provider (see below), open **AI Assistant** in the sidebar and describe what you want. For example: _"Build a weather and transit page for my morning commute."_

FiestaBot shows each action in the panel as it runs, and the app takes you to the page it's working on so you can watch it fill in. Then keep the conversation going: ask it to replace a line with today's date, or try a completely different layout. When a request is ambiguous, it asks first.

Pages it creates or edits are applied right away, so treat the result as a draft. Open it in the [page editor](/docs/features/page-editor), check the preview, and adjust anything by hand before you put it on a schedule.

## Connect your own provider

FiestaBoard doesn't bundle an AI service or any credentials, and there's no FiestaBoard-hosted AI proxy. In **Settings → AI Providers**, you connect a provider of your choice: sign in with a supported account, paste an API key from a supported service, or point FiestaBoard at a model server on your own network. The **AI Assistant** item appears once a provider is set up and enabled. Your provider's own pricing and terms apply.

## What the provider sees

Each time you send a message, FiestaBot sends it to the provider you configured, along with context to work from. That includes the page open in the editor, the variable list of your enabled plugins (which can include details you've configured, such as transit station IDs or location names), and a listing of your pages, schedules, carousels, and installed plugins. That listing has names and IDs only, not their content. The open page is different: its content is sent.

The [AI Providers guide](/docs/setup/ai-providers) covers setup and lists exactly what is sent.
