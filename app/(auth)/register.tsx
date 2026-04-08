import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegisterUser, getCurrentUser } from '@/lib/api/generated/auth/auth';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { mutateAsync: register, isPending } = useRegisterUser();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    setErrorMsg('');
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      setErrorMsg('Пожалуйста, заполните все поля');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg('Некорректный формат email');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Пароли не совпадают');
      return;
    }

    try {
      // 1. Регистрация возвращает сразу TokenPair!
      const tokenPair = await register({ data: { username: trimmedUsername, email: trimmedEmail, password } });
      
      // Авторизуем в системе немедленно
      setAuth(
        { id: '', email: trimmedEmail, username: trimmedUsername, created_at: '' }, 
        tokenPair.access_token
      );

      // 2. Получаем полные данные юзера как при логине
      try {
        const userProfile = await getCurrentUser();
        setAuth(userProfile, tokenPair.access_token);
        router.replace('/');
      } catch (profileErr) {
        // Если что-то не так с загрузкой профиля, все равно пустим внутрь (или на страницу логина)
        setErrorMsg('Ошибка получения профиля. Зайдите заново.');
        router.replace('/(auth)/login');
      }

    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      setErrorMsg(serverMsg || 'Ошибка при регистрации. Возможно, пользователь уже существует.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 justify-center py-10">
            <View className="mb-10 items-center">
              <Text className="text-foreground text-4xl font-black tracking-widest mb-2">
                Регистрация
              </Text>
              <Text className="text-muted-foreground text-lg text-center">
                Создайте аккаунт и присоединяйтесь к нам
              </Text>
            </View>

            <View className="space-y-4 gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Имя пользователя (никнейм)</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="cooluser"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  className="w-full bg-card/80 text-foreground px-4 py-4 rounded-2xl border border-border"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Электронная почта</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="yours@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="w-full bg-card/80 text-foreground px-4 py-4 rounded-2xl border border-border"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Пароль</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  className="w-full bg-card/80 text-foreground px-4 py-4 rounded-2xl border border-border"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Повторите пароль</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  className="w-full bg-card/80 text-foreground px-4 py-4 rounded-2xl border border-border"
                />
              </View>

              {!!errorMsg && (
                <Text className="text-destructive font-medium text-sm text-center">
                  {errorMsg}
                </Text>
              )}

              <Pressable
                onPress={handleRegister}
                disabled={isPending}
                className={`w-full py-4 mt-4 rounded-2xl items-center justify-center flex-row ${
                  isPending ? 'bg-primary/70' : 'bg-primary'
                }`}
              >
                {isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Создать аккаунт</Text>
                )}
              </Pressable>

              <View className="flex-row items-center justify-center mt-6 gap-1">
                <Text className="text-muted-foreground text-base">Уже есть аккаунт?</Text>
                <Pressable onPress={() => router.push('/(auth)/login')}>
                  <Text style={{ color: '#1E9954' }} className="font-bold text-base">Войти</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
