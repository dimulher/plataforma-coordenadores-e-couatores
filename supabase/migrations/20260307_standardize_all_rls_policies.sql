-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::text;
$$;

CREATE OR REPLACE FUNCTION public.is_manager_of(target_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_uid 
    AND (
      manager_id = auth.uid() 
      OR 
      coordinator_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator_of(target_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_uid 
    AND coordinator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_manager(target_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND manager_id = target_uid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_coordinator(target_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND coordinator_id = target_uid
  );
$$;

-- 2. profiles
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_hierarchy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_my_manager" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_owner_admin" ON public.profiles;

CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Hierarchy reads
CREATE POLICY "profiles_select_gestor" ON public.profiles FOR SELECT USING (get_my_role() = 'GESTOR' AND is_manager_of(id));
CREATE POLICY "profiles_select_coordinator" ON public.profiles FOR SELECT USING (get_my_role() = 'COORDENADOR' AND coordinator_id = auth.uid());
CREATE POLICY "profiles_select_coautor" ON public.profiles FOR SELECT USING (get_my_role() IN ('COAUTOR', 'COORDENADOR') AND (is_my_coordinator(id) OR is_my_manager(id)));


-- 3. chapters
DROP POLICY IF EXISTS "chapters_delete_admin" ON public.chapters;
DROP POLICY IF EXISTS "chapters_insert_own" ON public.chapters;
DROP POLICY IF EXISTS "chapters_insert_staff_gestor" ON public.chapters;
DROP POLICY IF EXISTS "chapters_select_own" ON public.chapters;
DROP POLICY IF EXISTS "chapters_select_staff_gestor" ON public.chapters;
DROP POLICY IF EXISTS "chapters_update_own" ON public.chapters;
DROP POLICY IF EXISTS "chapters_update_staff_gestor" ON public.chapters;
DROP POLICY IF EXISTS "coordinator_read_coauthor_chapters" ON public.chapters;
DROP POLICY IF EXISTS "coordinator_update_coauthor_chapters" ON public.chapters;
DROP POLICY IF EXISTS "gestor_select_chapters" ON public.chapters;

CREATE POLICY "chapters_admin_all" ON public.chapters FOR ALL USING (get_my_role() = 'ADMIN');
-- Coautor
CREATE POLICY "chapters_own_all" ON public.chapters FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
-- Gestor
CREATE POLICY "chapters_gestor_all" ON public.chapters FOR ALL USING (get_my_role() = 'GESTOR' AND is_manager_of(author_id)) WITH CHECK (get_my_role() = 'GESTOR' AND is_manager_of(author_id));
-- Coordinator
CREATE POLICY "chapters_coordinator_all" ON public.chapters FOR ALL USING (get_my_role() = 'COORDENADOR' AND is_coordinator_of(author_id)) WITH CHECK (get_my_role() = 'COORDENADOR' AND is_coordinator_of(author_id));


-- 4. chapter_versions
DROP POLICY IF EXISTS "cv_delete_own" ON public.chapter_versions;
DROP POLICY IF EXISTS "cv_insert_own" ON public.chapter_versions;
DROP POLICY IF EXISTS "cv_select_own" ON public.chapter_versions;
DROP POLICY IF EXISTS "cv_staff_gestor" ON public.chapter_versions;

CREATE POLICY "cv_admin_all" ON public.chapter_versions FOR ALL USING (get_my_role() = 'ADMIN');
-- Basic association with author
CREATE POLICY "cv_own_all" ON public.chapter_versions FOR ALL USING (
  EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND c.author_id = auth.uid())
);
-- Gestor
CREATE POLICY "cv_gestor_all" ON public.chapter_versions FOR ALL USING (
  get_my_role() = 'GESTOR' AND EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND is_manager_of(c.author_id))
) WITH CHECK (
  get_my_role() = 'GESTOR' AND EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND is_manager_of(c.author_id))
);
-- Coordinator
CREATE POLICY "cv_coordinator_all" ON public.chapter_versions FOR ALL USING (
  get_my_role() = 'COORDENADOR' AND EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND is_coordinator_of(c.author_id))
) WITH CHECK (
  get_my_role() = 'COORDENADOR' AND EXISTS (SELECT 1 FROM chapters c WHERE c.id = chapter_versions.chapter_id AND is_coordinator_of(c.author_id))
);


-- 5. projects & project_participants
DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_admin" ON public.projects;
DROP POLICY IF EXISTS "projects_select_participant" ON public.projects;
DROP POLICY IF EXISTS "projects_select_staff_gestor" ON public.projects;
DROP POLICY IF EXISTS "projects_update_admin" ON public.projects;

CREATE POLICY "projects_admin_all" ON public.projects FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "projects_staff_select" ON public.projects FOR SELECT USING (get_my_role() IN ('GESTOR', 'COORDENADOR'));
CREATE POLICY "projects_participant_select" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_participants pp WHERE pp.project_id = projects.id AND pp.user_id = auth.uid())
);

DROP POLICY IF EXISTS "pp_delete_admin" ON public.project_participants;
DROP POLICY IF EXISTS "pp_insert_staff_gestor" ON public.project_participants;
DROP POLICY IF EXISTS "pp_select_own" ON public.project_participants;
DROP POLICY IF EXISTS "pp_select_staff_gestor" ON public.project_participants;

CREATE POLICY "pp_admin_all" ON public.project_participants FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "pp_gestor_all" ON public.project_participants FOR ALL USING (get_my_role() = 'GESTOR' AND is_manager_of(user_id)) WITH CHECK (get_my_role() = 'GESTOR' AND is_manager_of(user_id));
CREATE POLICY "pp_staff_select" ON public.project_participants FOR SELECT USING (get_my_role() IN ('GESTOR', 'COORDENADOR'));
CREATE POLICY "pp_own_select" ON public.project_participants FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pp_coordinator_manage_own_coauthors" ON public.project_participants FOR ALL USING (get_my_role() = 'COORDENADOR' AND is_coordinator_of(user_id)) WITH CHECK (get_my_role() = 'COORDENADOR' AND is_coordinator_of(user_id));


-- 6. Coordinator specific tables (leads, payments, activities, site_requests)
-- leads
DROP POLICY IF EXISTS "coordinator_own_leads_delete" ON public.leads;
DROP POLICY IF EXISTS "coordinator_own_leads_insert" ON public.leads;
DROP POLICY IF EXISTS "coordinator_own_leads_select" ON public.leads;
DROP POLICY IF EXISTS "coordinator_own_leads_update" ON public.leads;

CREATE POLICY "leads_admin_all" ON public.leads FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "leads_coordinator_all" ON public.leads FOR ALL USING (coordinator_id = auth.uid()) WITH CHECK (coordinator_id = auth.uid());
CREATE POLICY "leads_gestor_select" ON public.leads FOR SELECT USING (get_my_role() = 'GESTOR' AND is_manager_of(coordinator_id));

-- payments
DROP POLICY IF EXISTS "coordinator_own_payments_delete" ON public.payments;
DROP POLICY IF EXISTS "coordinator_own_payments_insert" ON public.payments;
DROP POLICY IF EXISTS "coordinator_own_payments_select" ON public.payments;
DROP POLICY IF EXISTS "coordinator_own_payments_update" ON public.payments;

CREATE POLICY "payments_admin_all" ON public.payments FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "payments_coordinator_all" ON public.payments FOR ALL USING (coordinator_id = auth.uid()) WITH CHECK (coordinator_id = auth.uid());
CREATE POLICY "payments_gestor_select" ON public.payments FOR SELECT USING (get_my_role() = 'GESTOR' AND is_manager_of(coordinator_id));

-- coordinator_activities
DROP POLICY IF EXISTS "coordinator_own_activities_insert" ON public.coordinator_activities;
DROP POLICY IF EXISTS "coordinator_own_activities_select" ON public.coordinator_activities;

CREATE POLICY "activities_admin_all" ON public.coordinator_activities FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "activities_coordinator_all" ON public.coordinator_activities FOR ALL USING (coordinator_id = auth.uid()) WITH CHECK (coordinator_id = auth.uid());
CREATE POLICY "activities_gestor_select" ON public.coordinator_activities FOR SELECT USING (get_my_role() = 'GESTOR' AND is_manager_of(coordinator_id));

-- site_requests
DROP POLICY IF EXISTS "sr_insert_coordinator" ON public.site_requests;
DROP POLICY IF EXISTS "sr_insert_own" ON public.site_requests;
DROP POLICY IF EXISTS "sr_select_coordinator" ON public.site_requests;
DROP POLICY IF EXISTS "sr_select_own" ON public.site_requests;
DROP POLICY IF EXISTS "sr_staff" ON public.site_requests;
DROP POLICY IF EXISTS "sr_update_coordinator" ON public.site_requests;
DROP POLICY IF EXISTS "sr_update_own" ON public.site_requests;

CREATE POLICY "sr_admin_all" ON public.site_requests FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "sr_coordinator_all" ON public.site_requests FOR ALL USING (coordinator_id = auth.uid()) WITH CHECK (coordinator_id = auth.uid());
CREATE POLICY "sr_gestor_select" ON public.site_requests FOR SELECT USING (get_my_role() = 'GESTOR' AND is_manager_of(coordinator_id));

-- 7. reviewer_notes
DROP POLICY IF EXISTS "rn_select_chapter_author" ON public.reviewer_notes;
DROP POLICY IF EXISTS "rn_staff_gestor" ON public.reviewer_notes;

CREATE POLICY "rn_admin_all" ON public.reviewer_notes FOR ALL USING (get_my_role() = 'ADMIN');
CREATE POLICY "rn_staff_all" ON public.reviewer_notes FOR ALL USING (get_my_role() IN ('GESTOR', 'COORDENADOR')) WITH CHECK (get_my_role() IN ('GESTOR', 'COORDENADOR'));
CREATE POLICY "rn_author_select" ON public.reviewer_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM chapters c WHERE c.id = reviewer_notes.chapter_id AND c.author_id = auth.uid())
);
