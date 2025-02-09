'use client';

import { createBrowserClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function OnboardingPage() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [usernameState, setUsernameState] = useState({
    isChecking: false,
    isValid: false,
    error: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [debounceTimeout, setDebounceTimeout] = useState(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    checkUser()
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout)
      }
    }
  }, [])

  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      redirect('/login')
    }
    setUser(user)

    // Check if user already has a username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    if (profile?.username) {
      redirect('/')
    }
  }

  const validateUsername = (value) => {
    const formatRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/
    return formatRegex.test(value)
  }

  const checkUsernameAvailability = async (value) => {
    if (!validateUsername(value)) {
      setUsernameState({
        isChecking: false,
        isValid: false,
        error: 'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, or underscores'
      })
      return
    }

    setUsernameState(prev => ({ ...prev, isChecking: true, error: null }))

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', value)
        .single()

      if (error && error.code === 'PGRST116') {
        // No match found - username is available
        setUsernameState({
          isChecking: false,
          isValid: true,
          error: null
        })
      } else {
        setUsernameState({
          isChecking: false,
          isValid: false,
          error: 'Username already taken'
        })
      }
    } catch (err) {
      setUsernameState({
        isChecking: false,
        isValid: false,
        error: 'Error checking username availability'
      })
    }
  }

  const handleUsernameChange = (e) => {
    const { value } = e.target
    setUsername(value)
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    const newTimeout = setTimeout(() => {
      checkUsernameAvailability(value)
    }, 500)

    setDebounceTimeout(newTimeout)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!usernameState.isValid || usernameState.isChecking) return

    try {
      setIsLoading(true)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username,
          username_updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      redirect('/')
    } catch (err) {
      console.error('Error updating username:', err)
      setUsernameState(prev => ({
        ...prev,
        error: 'Error saving username'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to Win of the Day!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Choose a username to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={handleUsernameChange}
                  className="block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {usernameState.isChecking ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-400" />
                  ) : username && (
                    usernameState.isValid ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )
                  )}
                </div>
              </div>
              {usernameState.error && (
                <p className="mt-2 text-sm text-red-600">{usernameState.error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!usernameState.isValid || usernameState.isChecking || isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
