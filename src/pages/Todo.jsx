import { useState, useEffect } from "react";
import { ref, set, onValue, remove } from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { database, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./todo.css";
import {
  faUser,
  faCheck,
  faTrash,
  faPen,
  faSignOutAlt,
  faInfoCircle,
  faPlus,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { Dialog } from "@headlessui/react";

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editedTodo, setEditedTodo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [remainingTimes, setRemainingTimes] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState("remainingTime"); // Default sorting option
  const [selectedPriority, setSelectedPriority] = useState("Medium"); // Default to Medium
  const [editedPriority, setEditedPriority] = useState("Medium");
  const [username, setUsername] = useState("");
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const todoRef = ref(database, `todos/${user.uid}/`);
      const userRef = ref(database, `users/${user.uid}/username`);

      const unsubscribeTodos = onValue(todoRef, (snapshot) => {
        const data = snapshot.val();
        const todoList = data
          ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
          : [];
        setTodos(todoList);
      });

      const unsubscribeUsername = onValue(userRef, (snapshot) => {
        const username = snapshot.val();
        setUsername(username || "User");
      });

      return () => {
        unsubscribeTodos();
        unsubscribeUsername(); // Call the unsubscribe function here
      };
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const updatedTimes = todos.reduce((acc, todo) => {
      acc[todo.id] = calculateRemainingTime(todo.deadline);
      return acc;
    }, {});
    setRemainingTimes(updatedTimes);
  }, [todos]);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimes = todos.reduce((acc, todo) => {
        acc[todo.id] = calculateRemainingTime(todo.deadline);
        return acc;
      }, {});
      setRemainingTimes(updatedTimes);
    }, 1000); // Update every second to show real-time changes

    return () => clearInterval(interval);
  }, [todos]);

  const calculateRemainingTime = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const remainingTime = deadlineDate - now;

    if (remainingTime < 0) return "Expired";

    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${days}d ${hours}h ${minutes}m`;
  };

  const sortedTodos = [...todos].sort((a, b) => {
    const timeA = remainingTimes[a.id];
    const timeB = remainingTimes[b.id];

    if (a.completed && !b.completed) return 1; // Completed tasks go to the end
    if (!a.completed && b.completed) return -1; // Non-completed tasks stay in front

    if (timeA === "Expired" && timeB !== "Expired") return 1;
    if (timeB === "Expired" && timeA !== "Expired") return -1;
    if (timeA === "Expired" && timeB === "Expired") return 0;

    if (sortOption === "remainingTime") {
      const remainingTimeA = new Date(a.deadline) - new Date();
      const remainingTimeB = new Date(b.deadline) - new Date();
      return remainingTimeA - remainingTimeB;
    } else if (sortOption === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const addTodo = () => {
    if (user && newTodo.trim() && newDeadline) {
      if (isDeadlineValid(newDeadline)) {
        const todoId = uuidv4();
        const now = new Date();
        set(ref(database, `todos/${user.uid}/${todoId}`), {
          todo: newTodo,
          completed: false,
          createdAt: now.toISOString(),
          deadline: newDeadline,
          priority: selectedPriority, // Save priority here
        });
        setNewTodo("");
        setNewDeadline("");
        setSelectedPriority("Medium"); // Reset priority after adding
        setIsAddModalOpen(false);
      } else {
        alert("The deadline must be at least 2 minutes from the current time.");
      }
    }
  };

  const deleteTodo = (id) => {
    if (user) {
      remove(ref(database, `todos/${user.uid}/${id}`));
    }
  };

  const handleEdit = (id) => {
    setEditingTodoId(id);
    const todo = todos.find((todo) => todo.id === id);
    setEditedTodo(todo.todo);
    setNewDeadline(todo.deadline); // Set deadline when editing
    setEditedPriority(todo.priority); // Set priority when editing
    setIsModalOpen(true);
  };

  const saveEdit = () => {
    if (user && editedTodo.trim() && isDeadlineValid(newDeadline)) {
      // Update the todo in Firebase with the edited values
      set(ref(database, `todos/${user.uid}/${editingTodoId}`), {
        ...todos.find((todo) => todo.id === editingTodoId),
        todo: editedTodo,
        deadline: newDeadline, // Save the new deadline
        priority: editedPriority, // Save the new priority
      });

      // Close the modal and reset state after saving
      setIsModalOpen(false);
      setEditingTodoId(null);
      setEditedTodo("");
      setNewDeadline(""); // Clear deadline after saving
    } else if (!isDeadlineValid(newDeadline)) {
      alert("The deadline must be at least 2 minutes from the current time.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleShowDetails = (todo) => {
    setSelectedTodo(todo);
    setIsModalOpen(true);
  };
  const saveUsernameEdit = () => {
    if (user && editedUsername.trim()) {
      set(ref(database, `users/${user.uid}/username`), editedUsername)
        .then(() => {
          setUsername(editedUsername); // Update state with the new username
          setIsUsernameModalOpen(false); // Close modal
        })
        .catch((error) => {
          console.error("Error updating username:", error);
        });
    } else {
      alert("Username cannot be empty.");
    }
  };

  const isDeadlineValid = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const minimumDeadline = new Date(now.getTime() + 60000); // Current time + 2 minutes
    return deadlineDate >= minimumDeadline;
  };
  const completeTodo = (id) => {
    if (user) {
      const todoToUpdate = todos.find((todo) => todo.id === id);
      set(ref(database, `todos/${user.uid}/${id}`), {
        ...todoToUpdate,
        completed: true,
        completedAt: new Date().toISOString(), // Add completion date
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 relative">
      {/* Static Navbar */}
      {user && (
        <div className="fixed top-0 left-0 w-full bg-gray-800 text-white p-4 flex flex-col sm:flex-row items-center sm:justify-between shadow-md z-50">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faUser} className="mr-2" />{" "}
            {/* Change to user icon */}
            <span className="text-lg font-semibold">{username}</span>{" "}
            <button
              onClick={() => {
                setEditedUsername(username); // Set current username in the input
                setIsUsernameModalOpen(true);
              }}
              className="text-white focus:outline-none pl-2"
            >
              <FontAwesomeIcon icon={faEdit} className="text-sm" />{" "}
            </button>
            {/* Display username */}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 mt-2 sm:mt-0 rounded flex items-center hover:bg-red-700 focus:outline-none"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Logout
          </button>
        </div>
      )}
      {/* username edit modal  */}
      <Dialog
        open={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
      >
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-md z-50"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Panel className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <Dialog.Title className="text-xl text-white font-bold mb-4">
              Edit Username
            </Dialog.Title>
            <input
              type="text"
              value={editedUsername}
              onChange={(e) => setEditedUsername(e.target.value)}
              className="w-full p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none mb-4"
              placeholder="Enter new username"
            />
            <button
              onClick={saveUsernameEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsUsernameModalOpen(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-4"
            >
              Cancel
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="pt-16 sm:pt-20 ">
        <h2 className="text-2xl font-bold text-center mb-8">Todo List</h2>
        <div className="max-w-lg mx-auto bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-center">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white -translate-y-12 border-[12px] border-gray-900 p-4 mb-[-45px] rounded-full hover:bg-blue-700 focus:outline-none flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faPlus} size="x" />
            </button>
          </div>
          {/* sort list */}
          <div className="flex flex-col justify-center text-center mt-4 mb-4">
            <label className="text-gray-400 mr-2 mb-2">Sort By</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none"
            >
              <option value="remainingTime">Remaining Time</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <ul>
            {sortedTodos.map((todo) => (
              <li
                key={todo.id}
                className={`flex flex-col justify-between p-2 mb-2 rounded-lg ${
                  todo.completed
                    ? "bg-green-800 text-white" // Green background and white text for completed tasks
                    : remainingTimes[todo.id] === "Expired"
                    ? "line-through text-gray-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {/* Task name, info button, and action buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShowDetails(todo)}
                      className={`text-center ${
                        todo.completed
                          ? "text-white" // White text for info button when completed
                          : todo.priority === "High"
                          ? "text-red-500 hover:text-red-600"
                          : todo.priority === "Medium"
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-green-500 hover:text-green-600"
                      }`}
                    >
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </button>
                    <span
                      className={`text-xs font-normal ${
                        todo.completed
                          ? "text-white" // White text for priority when completed
                          : todo.priority === "High"
                          ? "text-red-500"
                          : todo.priority === "Medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {todo.priority}
                    </span>
                  </div>

                  {/* Action buttons (delete, complete, edit) */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 focus:outline-none"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>

                    {/* Conditionally render complete and edit buttons if not completed */}
                    {!todo.completed && (
                      <>
                        <button
                          onClick={() => completeTodo(todo.id, todo.completed)}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 focus:outline-none"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button
                          onClick={() => handleEdit(todo.id)}
                          className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 focus:outline-none"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-grow truncate">{todo.todo}</div>
                <div className="mt-2 text-sm">
                  {todo.completed && todo.completedAt ? (
                    <div className="text-xs">
                      Completed on: {formatDeadline(todo.completedAt)}
                    </div>
                  ) : (
                    <div>
                      Deadline:{" "}
                      {todo.deadline
                        ? formatDeadline(todo.deadline)
                        : "No deadline"}
                    </div>
                  )}
                </div>

                {/* Remaining time at the bottom */}
                {todo.completed && todo.completedAt ? (
                  <div>
                    {/* You can add content here for completed tasks */}
                  </div>
                ) : (
                  remainingTimes[todo.id] && (
                    <div
                      className={`text-xs mt-2 ${
                        remainingTimes[todo.id] === "Expired"
                          ? "text-red-400"
                          : "text-gray-400"
                      }`}
                    >
                      Remaining: {remainingTimes[todo.id]}
                    </div>
                  )
                )}

                <hr className="mt-5 border-gray-700" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={isModalOpen && editingTodoId !== null}
        onClose={() => setIsModalOpen(false)}
      >
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-md z-50"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Panel className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <Dialog.Title className="text-xl text-white font-bold mb-4">
              Edit Todo
            </Dialog.Title>
            <input
              type="text"
              maxLength={15}
              value={editedTodo}
              onChange={(e) => setEditedTodo(e.target.value)}
              className="w-full p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none mb-4"
              placeholder="Edit task name"
            />
            <select
              id="priority"
              value={editedPriority}
              onChange={(e) => setEditedPriority(e.target.value)}
              className="p-2 border-none bg-gray-700 text-white w-full mb-4 focus:ring-0 outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none mb-4"
              placeholder="Edit deadline"
            />
            <button
              onClick={saveEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-4"
            >
              Cancel
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Add Todo Modal */}
      {/* Add Todo Modal */}
      <Dialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-md z-50"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Panel className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <Dialog.Title className="text-xl text-white font-bold mb-4">
              Add New Task
            </Dialog.Title>

            {/* Task Name Input */}
            <label className="block text-gray-400 mb-2">Task Name</label>
            <input
              type="text"
              maxLength={15}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="w-full p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none mb-4"
              placeholder="Enter task description"
            />
            <label className="block text-gray-400 mb-2">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none mb-4"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Deadline Input */}
            <label className="block text-gray-400 mb-2">Deadline</label>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full custom-date-input p-2 border-none bg-gray-700 text-white focus:ring-0 outline-none mb-4"
            />

            {/* Add and Cancel Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={addTodo}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Task
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Details Modal */}
      <Dialog
        open={selectedTodo !== null}
        onClose={() => setSelectedTodo(null)}
      >
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-md z-50"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Panel className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <Dialog.Title className="text-xl text-white font-bold mb-4">
              Todo Details
            </Dialog.Title>
            {selectedTodo && (
              <>
                <p className="text-white mb-2">
                  <strong>Task:</strong> {selectedTodo.todo}
                </p>
                <p className="text-white mb-2">
                  <strong>Created At:</strong>{" "}
                  {new Date(selectedTodo.createdAt).toLocaleString()}
                </p>
                <p className="text-white mb-2">
                  <strong>Deadline:</strong>{" "}
                  {new Date(selectedTodo.deadline).toLocaleString()}
                </p>
                <p className="text-white mb-2">
                  <strong>Remaining Time:</strong>{" "}
                  {selectedTodo.completed
                    ? "Completed" // Show 'Completed' if the task is completed
                    : remainingTimes[selectedTodo.id] || "No remaining time"}
                </p>
                {selectedTodo.completed && (
                  <p className="text-white mb-2">
                    <strong>Completed On:</strong>{" "}
                    {new Date(selectedTodo.completedAt).toLocaleString()}
                  </p>
                )}
              </>
            )}
            <button
              onClick={() => setSelectedTodo(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Todo;
