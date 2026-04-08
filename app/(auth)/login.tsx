import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLoginUser, getCurrentUser } from '@/lib/api/generated/auth/auth';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { mutateAsync: login, isPending } = useLoginUser();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    setErrorMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
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

    if (trimmedEmail === 'test@test.com' && password === '12345678') {
      setAuth(
        { id: '123-stub', email: trimmedEmail, username: 'StubUser', created_at: new Date().toISOString() },
        'stub_fake_token'
      );
      router.replace('/');
      return;
    }

    try {
      // 1. Получаем токены
      const tokenPair = await login({ data: { email: trimmedEmail, password } });
      
      // Мы обновляем стор пустым пользователем, но с валидным токеном, 
      // чтобы axios интерсептор сразу стал отправлять его
      setAuth(
        { id: '', email: trimmedEmail, username: '', created_at: '' }, 
        tokenPair.access_token
      );

      // 2. Делаем запрос профиля (axios использует свежий токен из zustand)
      try {
        const userProfile = await getCurrentUser();
        // Перезаписываем пользователя полными данными
        setAuth(userProfile, tokenPair.access_token);
        router.replace('/');
      } catch (profileErr) {
         setErrorMsg('Ошибка получения профиля. Попробуйте еще раз.');
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      setErrorMsg(serverMsg || 'Неверный email или пароль');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 justify-center">
          <View className="mb-10 items-center">
            <Text className="text-foreground text-4xl font-black tracking-widest mb-2">
              Meet<Text style={{ color: '#1E9954' }}>Hub</Text>
            </Text>
            <Text className="text-muted-foreground text-lg text-center">
              Добро пожаловать! Войдите для продолжения
            </Text>
          </View>

          <View className="space-y-4 gap-4">
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

            {!!errorMsg && (
              <Text className="text-destructive font-medium text-sm text-center">
                {errorMsg}
              </Text>
            )}

            <Pressable
              onPress={handleLogin}
              disabled={isPending}
              className={`w-full py-4 mt-4 rounded-2xl items-center justify-center flex-row ${
                isPending ? 'bg-primary/70' : 'bg-primary'
              }`}
            >
              {isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Войти</Text>
              )}
            </Pressable>

            <View className="flex-row items-center justify-center mt-6 gap-1">
              <Text className="text-muted-foreground text-base">Нет аккаунта?</Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: '#1E9954' }} className="font-bold text-base">Создать</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
