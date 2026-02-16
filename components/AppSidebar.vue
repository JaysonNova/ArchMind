<template>
  <Sidebar collapsible="icon">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in menuItems" :key="item.to">
              <SidebarMenuButton as-child :is-active="isActive(item.to)">
                <NuxtLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <button @click="handleNewProject" class="w-full">
              <Plus />
              <span>{{ $t('nav.newProject') }}</span>
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FolderOpen, Database, Plus } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '~/components/ui/sidebar'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const menuItems = computed(() => [
  { to: '/', label: t('nav.projects'), icon: FolderOpen },
  { to: '/knowledge-base', label: t('nav.knowledgeBase'), icon: Database }
])

const isActive = (path: string) => {
  return route.path === path
}

function handleNewProject() {
  router.push('/generate')
}
</script>
