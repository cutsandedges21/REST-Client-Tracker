import { useState, useEffect } from 'react'
import { GlowCard } from './GlowCard'

interface OneTimeTasksProps {
  onTasksChange: (tasks: Array<{ amount: number; timeSpent: number }>) => void
  onExpensesChange: (expenses: Array<{ amount: number }>) => void
  username?: string
}

interface Task {
  id: number
  description: string
  amount: number
  timeSpent: number
  date: string
}

interface Expense {
  id: number
  description: string
  amount: number
  date: string
}

export function OneTimeTasks({ onTasksChange, onExpensesChange, username }: OneTimeTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes')

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')

  useEffect(() => {
    if (!username) return
    const savedTasks = localStorage.getItem(`oneTimeTasks_${username}`)
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks)
      setTasks(parsedTasks)
      if (onTasksChange) {
        onTasksChange(parsedTasks)
      }
    }

    const savedExpenses = localStorage.getItem(`expenses_${username}`)
    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses)
      setExpenses(parsedExpenses)
      if (onExpensesChange) {
        onExpensesChange(parsedExpenses)
      }
    }
  }, [onTasksChange, onExpensesChange, username])

  const addTask = () => {
    if (!username) return
    if (!description || !amount || !timeSpent) {
      alert('Please fill in all fields')
      return
    }

    // Convert hours to minutes if needed
    const timeInMinutes = timeUnit === 'hours' ? parseFloat(timeSpent) * 60 : parseFloat(timeSpent)

    const newTask: Task = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      timeSpent: timeInMinutes,
      date: new Date().toISOString()
    }

    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    localStorage.setItem(`oneTimeTasks_${username}`, JSON.stringify(updatedTasks))
    if (onTasksChange) {
      onTasksChange(updatedTasks)
    }

    // Clear form
    setDescription('')
    setAmount('')
    setTimeSpent('')
  }

  const removeTask = (id: number) => {
    if (!username) return
    const updatedTasks = tasks.filter(task => task.id !== id)
    setTasks(updatedTasks)
    localStorage.setItem(`oneTimeTasks_${username}`, JSON.stringify(updatedTasks))
    if (onTasksChange) {
      onTasksChange(updatedTasks)
    }
  }

  const addExpense = () => {
    if (!username) return
    if (!expenseDescription || !expenseAmount) {
      alert('Please fill in all fields')
      return
    }

    const newExpense: Expense = {
      id: Date.now(),
      description: expenseDescription,
      amount: parseFloat(expenseAmount),
      date: new Date().toISOString()
    }

    const updatedExpenses = [...expenses, newExpense]
    setExpenses(updatedExpenses)
    localStorage.setItem(`expenses_${username}`, JSON.stringify(updatedExpenses))
    if (onExpensesChange) {
      onExpensesChange(updatedExpenses)
    }

    // Clear form
    setExpenseDescription('')
    setExpenseAmount('')
  }

  const removeExpense = (id: number) => {
    if (!username) return
    const updatedExpenses = expenses.filter(expense => expense.id !== id)
    setExpenses(updatedExpenses)
    localStorage.setItem(`expenses_${username}`, JSON.stringify(updatedExpenses))
    if (onExpensesChange) {
      onExpensesChange(updatedExpenses)
    }
  }

  const totalAmount = tasks.reduce((sum, task) => sum + task.amount, 0)
  const totalTime = tasks.reduce((sum, task) => sum + task.timeSpent, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

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
              <span className="text-sm font-medium text-slate-700">Time Spent</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                  placeholder={timeUnit === 'hours' ? '1.5' : '90'}
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                />
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as 'minutes' | 'hours')}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
              <br></br>
            </label>

          </div>

          <button
            onClick={addTask}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
            style={{ backgroundColor: `rgb(var(--color-primary))` }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`}
          >
            Add Task
          </button>

          <br></br>
          <br></br>

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

          <div className="mt-8 border-t border-slate-200 pt-6">
            <br></br>
            <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>Expenses</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track business expenses like gas, equipment, supplies, etc.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    placeholder="Gas, equipment, supplies..."
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Amount ($)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    placeholder="25.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                </label>
              </div>

              <br></br>

              <button
                onClick={addExpense}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
                style={{ backgroundColor: `rgb(var(--color-primary))` }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`}
              >
                Add Expense
              </button>

              {expenses.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-slate-700">Total Expenses</h3>
                  <div className="rounded-lg p-3" style={{ backgroundColor: `rgba(var(--color-primary-light), 0.5)` }}>
                    <p className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>${totalExpenses.toFixed(2)}</p>
                  </div>

                  <h3 className="text-sm font-medium text-slate-700 mt-4">Recent Expenses</h3>
                  <ul className="space-y-2">
                    {expenses.map((expense) => (
                      <li key={expense.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{expense.description}</p>
                          <p className="text-xs text-slate-600">
                            ${expense.amount.toFixed(2)} • {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeExpense(expense.id)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                          aria-label="Remove expense"
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
        </div>
      </div>
    </GlowCard>
  )
}
