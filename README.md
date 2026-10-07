# ClinSole AI Assistant

Create a mobile application called ClinSole AI.

ClinSole AI is an AI-powered practice assistant designed specifically for independent foot care nurses and mobile foot care professionals.

The goal is to help foot care professionals manage patients, document visits, schedule appointments, track income, and grow their practice.

Create a modern healthcare technology design with a professional clinical appearance.

Include these screens:

User onboarding and login:

Email login

Create account

Foot care nurse profile setup

Nurse dashboard:

Today’s appointments

Patient count

Notes requiring completion

Monthly revenue

Upcoming follow-ups

Patient management:

Add patient

Patient profile

Medical history

Foot assessment history

Treatment records

Follow-up dates

AI SOAP Note Generator:
Allow nurses to enter brief visit notes.
Use AI to generate:

Subjective

Objective

Assessment

Plan

Allow editing and saving.

Appointment calendar:

Schedule visits

Patient reminders

Recurring appointments

Income tracker:

Track visits

Payments

Expenses

Monthly revenue dashboard

AI Business Assistant:
Generate:

Patient follow-up messages

Patient education materials

Marketing content

Business suggestions

Subscription system:
Free trial
Premium monthly subscription

Design the app for mobile use with simple navigation, healthcare icons, clean layouts, and a trustworthy professional feel.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://clinsole-ai-practice-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3cfd8151-814b-4f44-96ea-a4a97d0f8aa5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Independent development is supported with Node 22.12+ and npm:

```sh
git clone https://github.com/fsoubaneh01-web/clinsole-ai-practice-buddy.git
cd clinsole-ai-practice-buddy
npm ci
cp .env.example .env.local
# Configure staging credentials in .env.local, then:
npm run dev
```

See [the migration runbook](docs/migration-runbook.md) for the required staging
migration, independent AI configuration, production builds, and release checks.
Never commit `.env.local` or patient exports. Default builds use portable Node
hosting; the existing Lovable environment has an explicit compatibility path.
