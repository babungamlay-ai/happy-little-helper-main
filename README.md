# Happy Little Helper

hi

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6714b3e7-6ceb-4f01-b418-0f56e416fd1b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Initial administrator setup

Public signups receive the `beneficiary` role. They are never promoted to
`super_admin` automatically. After creating and confirming the designated
administrator account, run this statement in the Supabase SQL Editor while
signed in as a project owner. Replace the email with the administrator's
verified account email:

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin'::public.app_role
from auth.users
where email = 'admin@example.org'
on conflict (user_id, role) do nothing;
```

Confirm that the intended account is the only administrator before opening
public registration:

```sql
select users.email, roles.role
from public.user_roles as roles
join auth.users as users on users.id = roles.user_id
where roles.role = 'super_admin';
```

For an existing deployment, review and remove any unintended `super_admin`
roles manually. The migration prevents future public signups from receiving
that role; it does not revoke roles already assigned.
