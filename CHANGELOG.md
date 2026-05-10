# Changelog

All notable changes to the SaaS frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Super Admin **User Management → Directory** now shows Approve / Reject / Revoke actions for teachers and students (previously hidden because the row guard only allowed academy owners).
- Super Admin **Dashboard preview** now shows the actual academy status by querying `/academies/admin` and reading `academy.owner.{firstName,lastName,email}` instead of the deprecated `/users/admins` shape.
- Academy name displayed in the User Management table now reflects the owner's owned academy (driven by backend `entity.academy = { id, name, status }`).
- Teachers viewing the Students list now see masked emails (`a***@domain.com`) returned by the backend.

### Notes
- Auth flow: `SUPER_ADMIN` and `ACADEMY_OWNER` are auto-approved on OTP verification. Teachers and students remain `PENDING` until manually approved by a super admin or academy owner.
- See backend `docs/api-reference.md` for the full endpoint contract this frontend consumes.
