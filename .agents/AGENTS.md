# CourseFlix Project Rules

## Role Parity Rule
All UI, discussion, community, and workflow changes implemented for any role (`student`, `teacher`, `assistant`) MUST automatically be mirrored and applied identically across all other roles:
- **Community Course Lists**: WhatsApp 3-line layout (title + timestamp, grade + unread badge, preview text), unread lavender background tint, and course ordering.
- **Discussion Threads & Detail Views**: Single question body text (no separate title heading), zero-reply clean layout (no empty state illustration), Enter-to-send keyboard handling, circular WhatsApp-style send icon button, and uniform card borders.
- **Role Parity Audit**: Always ensure changes applied to `StudentCommunityPage`, `TeacherCommunityPage`, `DiscussionDetailPage`, `DiscussionsSection`, and shared community/discussion components are fully aligned across `student`, `teacher`, and `assistant` roles.
