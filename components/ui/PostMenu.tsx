'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical, Trash2, Pencil } from 'lucide-react';

interface PostMenuProps {
  onDelete: () => void;
  onEdit: () => void;
}

export default function PostMenu({ onDelete, onEdit }: PostMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-1 rounded-lg transition-colors duration-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
        <MoreVertical className="w-4 h-4" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700`}
                >
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit Post
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onDelete}
                  className={`${
                    active ? 'bg-red-50 text-red-600' : 'text-red-500'
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Delete Post
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
