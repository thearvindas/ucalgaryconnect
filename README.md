# UCalgaryConnect

UCalgaryConnect is a modern web application designed to help University of Calgary students connect with each other for academic collaboration, study groups, and project partnerships. Built with Next.js and Supabase, it provides a seamless platform for students to find and connect with peers who share similar academic interests and goals.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Profile Management**: Create and edit detailed academic profiles
- **Connection System**: Find and connect with other students
- **Real-time Updates**: Instant notifications for connection requests
- **Responsive Design**: Works seamlessly on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Animation**: Framer Motion

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm or yarn
- Git

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/thearvindas/ucalgaryconnect.git
   cd ucalgaryconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── profile/           # Profile management
│   └── connections/       # Connection management
├── components/            # Reusable components
├── lib/                   # Utility functions
└── types/                 # TypeScript type definitions
```

## 🔧 Key Features Implementation

### Authentication
- Uses Supabase Auth for secure user authentication
- Protected routes with middleware
- Session management with React Context

### Profile Management
- Dynamic form with validation
- Image upload support
- Real-time updates

### Connection System
- Two-way connection requests
- Status tracking (pending/accepted/declined)
- Real-time notifications


## 🚀 Deployment

The application is configured for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


