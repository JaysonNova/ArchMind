<template>
  <div class="min-h-screen bg-background">
    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold">{{ $t('profile.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ $t('profile.subtitle') }}</p>
      </div>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            {{ $t('profile.tabs.profile') }}
          </TabsTrigger>
          <TabsTrigger value="security">
            {{ $t('profile.tabs.security') }}
          </TabsTrigger>
          <TabsTrigger value="models" as-child>
            <NuxtLink to="/settings/models">
              AI 模型
            </NuxtLink>
          </TabsTrigger>
        </TabsList>

        <!-- Profile Tab -->
        <TabsContent value="profile" class="space-y-6">
          <!-- Avatar Section -->
          <Card>
            <CardHeader>
              <CardTitle>{{ $t('profile.avatar.title') }}</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex items-center gap-6">
                <ClientOnly>
                  <div class="relative">
                    <Avatar class="h-20 w-20">
                      <AvatarImage
                        :src="previewAvatar || authStore.avatarUrl"
                        :alt="authStore.displayName"
                        @load="avatarLoaded = true"
                        @error="avatarLoaded = true"
                      />
                      <AvatarFallback class="text-2xl bg-muted">
                        <Loader2 v-if="!avatarLoaded && authStore.avatarUrl" class="w-6 h-6 animate-spin text-muted-foreground" />
                        <span v-else>{{ authStore.displayName.charAt(0).toUpperCase() }}</span>
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </ClientOnly>
                <div class="space-y-2">
                  <Button variant="outline" @click="openCropperDialog">
                    <Upload class="w-4 h-4 mr-2" />
                    {{ $t('profile.avatar.change') }}
                  </Button>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('profile.avatar.uploadHint') }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Basic Info Section -->
          <Card>
            <CardHeader>
              <CardTitle>{{ $t('profile.info.title') }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Username (readonly) -->
              <div class="space-y-2">
                <Label>{{ $t('profile.info.username') }}</Label>
                <Input :model-value="authStore.user?.username" disabled />
              </div>

              <!-- Email (readonly) -->
              <div class="space-y-2">
                <Label>{{ $t('profile.info.email') }}</Label>
                <Input :model-value="authStore.user?.email" disabled />
              </div>

              <!-- Full Name -->
              <div class="space-y-2">
                <Label for="fullName">{{ $t('profile.info.fullName') }}</Label>
                <Input
                  id="fullName"
                  v-model="profileForm.fullName"
                  :placeholder="$t('profile.info.fullNamePlaceholder')"
                />
              </div>

              <div class="flex justify-end">
                <Button @click="handleSaveProfile" :disabled="authStore.loading">
                  <Loader2 v-if="authStore.loading" class="w-4 h-4 mr-2 animate-spin" />
                  {{ $t('common.save') }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Security Tab -->
        <TabsContent value="security" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{{ $t('profile.password.title') }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Current Password -->
              <div class="space-y-2">
                <Label for="currentPassword">{{ $t('profile.password.currentPassword') }}</Label>
                <Input
                  id="currentPassword"
                  v-model="passwordForm.currentPassword"
                  type="password"
                  :placeholder="$t('profile.password.currentPasswordPlaceholder')"
                />
              </div>

              <!-- New Password -->
              <div class="space-y-2">
                <Label for="newPassword">{{ $t('profile.password.newPassword') }}</Label>
                <Input
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  type="password"
                  :placeholder="$t('profile.password.newPasswordPlaceholder')"
                />
              </div>

              <!-- Confirm Password -->
              <div class="space-y-2">
                <Label for="confirmPassword">{{ $t('profile.password.confirmPassword') }}</Label>
                <Input
                  id="confirmPassword"
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  :placeholder="$t('profile.password.confirmPasswordPlaceholder')"
                />
              </div>

              <Alert v-if="passwordError" variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <AlertDescription>{{ passwordError }}</AlertDescription>
              </Alert>

              <div class="flex justify-end">
                <Button @click="handleChangePassword" :disabled="authStore.loading">
                  <Loader2 v-if="authStore.loading" class="w-4 h-4 mr-2 animate-spin" />
                  {{ $t('common.save') }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Avatar Cropper Dialog -->
    <AvatarCropperDialog
      v-model:open="cropperDialogOpen"
      :loading="uploadingAvatar"
      @crop="handleCropAvatar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Upload, Loader2, AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { useToast } from '~/components/ui/toast/use-toast'
import { useAuthStore } from '@/stores/auth'
import AvatarCropperDialog from '~/components/profile/AvatarCropperDialog.vue'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const authStore = useAuthStore()
const { toast } = useToast()

const activeTab = ref('profile')
const previewAvatar = ref<string | null>(null)
const passwordError = ref('')
const cropperDialogOpen = ref(false)
const uploadingAvatar = ref(false)
const avatarLoaded = ref(false)

const profileForm = reactive({
  fullName: authStore.user?.fullName || ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Reset form when user data changes
watch(() => authStore.user, (user) => {
  if (user) {
    profileForm.fullName = user.fullName || ''
  }
}, { immediate: true })

// 当头像 URL 变化时重置加载状态
watch(() => authStore.avatarUrl, () => {
  avatarLoaded.value = false
})

// Open cropper dialog
function openCropperDialog() {
  cropperDialogOpen.value = true
}

// Handle cropped avatar
async function handleCropAvatar(blob: Blob) {
  uploadingAvatar.value = true

  // Show preview immediately
  const reader = new FileReader()
  reader.onload = (e) => {
    previewAvatar.value = e.target?.result as string
  }
  reader.readAsDataURL(blob)

  // Convert blob to File for upload
  const file = new File([blob], 'avatar.jpg', { type: blob.type || 'image/jpeg' })

  // Upload avatar
  const result = await authStore.uploadAvatar(file)

  uploadingAvatar.value = false

  if (result.success) {
    cropperDialogOpen.value = false
    toast({
      title: t('profile.avatar.uploadSuccess'),
      variant: 'success'
    })
  } else {
    toast({
      title: result.message || t('profile.avatar.uploadFailed'),
      variant: 'destructive'
    })
    previewAvatar.value = null
  }
}

// Save profile
async function handleSaveProfile() {
  const result = await authStore.updateProfile({
    fullName: profileForm.fullName
  })

  if (result.success) {
    toast({
      title: t('profile.info.updateSuccess'),
      variant: 'success'
    })
  } else {
    toast({
      title: result.message || t('profile.info.updateFailed'),
      variant: 'destructive'
    })
  }
}

// Change password
async function handleChangePassword() {
  passwordError.value = ''

  // Validation
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    passwordError.value = t('auth.passwordRequired')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    passwordError.value = t('profile.password.minLength')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('profile.password.mismatch')
    return
  }

  const result = await authStore.changePassword(
    passwordForm.currentPassword,
    passwordForm.newPassword
  )

  if (result.success) {
    toast({
      title: t('profile.password.updateSuccess'),
      variant: 'success'
    })
    // Reset form
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    toast({
      title: result.message || t('profile.password.updateFailed'),
      variant: 'destructive'
    })
  }
}
</script>
