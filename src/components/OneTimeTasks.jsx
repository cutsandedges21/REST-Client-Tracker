import React, { useState, useEffect } from 'react'
import { GlowCard } from './GlowCard'

export function OneTimeTasks({ onTasksChange }) {
  const [tasks, setTasks] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [timeSpent, setTimeSpent] = useState('')

  useEffect(() => {
    const savedTasks = localStorage.getItem('oneTimeTasks')
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks)
      setTasks(parsedTasks)
      if (onTasksChange) {
        onTasksChange(parsedTasks)
      }
    }
  }, [onTasksChange])

  const addTask = () => {
    if (!description || !amount || !timeSpent) {
      alert('Please fill in all fields')
      return
    }

    const newTask = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      timeSpent: parseFloat(timeSpent),
      date: new Date().toISOString()
    }

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    localStorage.setItem('oneTimeTasks', JSON.stringify(updatedTasks))
    if (onTasksChange) {
      onTasksChange(updatedTasks)
    }

    // Clear form
    setDescription('')
    setAmount('')
    setTimeSpent('')
  }

  const removeTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id)
    setTasks(updatedTasks)
    localStorage.setItem('oneTimeTasks', JSON.stringify(updatedTasks))
    if (onTasksChange) {
      onTasksChange(updatedTasks)
    }
  }

  const totalAmount = tasks.reduce((sum, task) => sum + task.amount, 0)
  const totalTime = tasks.reduce((sum, task) => sum + task.timeSpent, 0)

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>One-Time Tasks</h2>
        <p className="mt-1 text-sm text-slate-600">
          Track one-time clients or tasks with earnings and time spent.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                placeholder="One-time lawn mowing"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Amount Earned ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                placeholder="50.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Time Spent (minutes)</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                placeholder="30"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
              />
              <br></br>
              <br></br>
            </label>
          </div>

          <button
            onClick={addTask}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
            style={{ backgroundColor: `var(--color-primary)` }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary-dark)`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary)`}
          >
            Add Task
          </button>

          {tasks.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium text-slate-700">All-Time Totals</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-3" style={{ backgroundColor: `rgba(var(--color-primary-light), 0.5)` }}>
                  <p className="text-xs text-slate-600">Total Earnings</p>
                  <p className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>${totalAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: `rgba(var(--color-primary-light), 0.5)` }}>
                  <p className="text-xs text-slate-600">Total Time</p>
                  <p className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>{totalTime.toFixed(0)} min</p>
                </div>
              </div>

              <h3 className="text-sm font-medium text-slate-700 mt-4">Recent Tasks</h3>
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{task.description}</p>
                      <p className="text-xs text-slate-600">
                        ${task.amount.toFixed(2)} • {task.timeSpent.toFixed(0)} min • {new Date(task.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                      aria-label="Remove task"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  )
}