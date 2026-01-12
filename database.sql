USE [ExamSystemDB]
GO
/****** Object:  Table [dbo].[ExamResults]    Script Date: 1/12/2026 6:27:23 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ExamResults](
	[ResultID] [int] IDENTITY(1,1) NOT NULL,
	[RollNo] [varchar](50) NULL,
	[Score] [int] NULL,
	[TotalQuestions] [int] NULL,
	[ExamDate] [datetime] NULL,
	[ExamID] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[ResultID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Exams]    Script Date: 1/12/2026 6:27:23 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Exams](
	[ExamID] [int] IDENTITY(1,1) NOT NULL,
	[ExamTitle] [varchar](100) NULL,
	[Subject] [varchar](100) NULL,
	[TeacherID] [int] NULL,
	[TotalQuestions] [int] NULL,
	[PassingMarks] [int] NULL,
	[IsPublished] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[ExamID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Questions]    Script Date: 1/12/2026 6:27:23 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Questions](
	[QID] [int] IDENTITY(1,1) NOT NULL,
	[QuestionText] [nvarchar](max) NULL,
	[OptionA] [varchar](255) NULL,
	[OptionB] [varchar](255) NULL,
	[OptionC] [varchar](255) NULL,
	[OptionD] [varchar](255) NULL,
	[CorrectAnswer] [varchar](10) NULL,
	[ExamID] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[QID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 1/12/2026 6:27:23 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	[FullName] [varchar](100) NULL,
	[RollNo] [varchar](50) NOT NULL,
	[Password] [varchar](50) NOT NULL,
	[Role] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[ExamResults] ON 
GO
INSERT [dbo].[ExamResults] ([ResultID], [RollNo], [Score], [TotalQuestions], [ExamDate], [ExamID]) VALUES (1, N'15692', 0, 1, CAST(N'2026-01-09T08:00:49.230' AS DateTime), NULL)
GO
INSERT [dbo].[ExamResults] ([ResultID], [RollNo], [Score], [TotalQuestions], [ExamDate], [ExamID]) VALUES (2, N'15692', 1, 6, CAST(N'2026-01-09T23:08:40.543' AS DateTime), NULL)
GO
INSERT [dbo].[ExamResults] ([ResultID], [RollNo], [Score], [TotalQuestions], [ExamDate], [ExamID]) VALUES (3, N'15692', 2, 7, CAST(N'2026-01-10T02:04:46.913' AS DateTime), NULL)
GO
SET IDENTITY_INSERT [dbo].[ExamResults] OFF
GO
SET IDENTITY_INSERT [dbo].[Exams] ON 
GO
INSERT [dbo].[Exams] ([ExamID], [ExamTitle], [Subject], [TeacherID], [TotalQuestions], [PassingMarks], [IsPublished]) VALUES (1, N'Exam: dbms', N'dbms', NULL, 5, 50, 1)
GO
INSERT [dbo].[Exams] ([ExamID], [ExamTitle], [Subject], [TeacherID], [TotalQuestions], [PassingMarks], [IsPublished]) VALUES (2, N'Mids', N'DBMS', 3, 1, 34, 1)
GO
INSERT [dbo].[Exams] ([ExamID], [ExamTitle], [Subject], [TeacherID], [TotalQuestions], [PassingMarks], [IsPublished]) VALUES (3, N'DBMS', N'SUBJECT', 3, NULL, 50, 0)
GO
SET IDENTITY_INSERT [dbo].[Exams] OFF
GO
SET IDENTITY_INSERT [dbo].[Users] ON 
GO
INSERT [dbo].[Users] ([UserID], [FullName], [RollNo], [Password], [Role]) VALUES (1, N'Super Admin', N'admin@gmail.com', N'1234', N'Admin')
GO
INSERT [dbo].[Users] ([UserID], [FullName], [RollNo], [Password], [Role]) VALUES (3, N'Sir Zubair', N'0322-0213', N'1234', N'Teacher')
GO
SET IDENTITY_INSERT [dbo].[Users] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Users__7886D5A1B7A6C1F0]    Script Date: 1/12/2026 6:27:23 AM ******/
ALTER TABLE [dbo].[Users] ADD UNIQUE NONCLUSTERED 
(
	[RollNo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[ExamResults] ADD  DEFAULT (getdate()) FOR [ExamDate]
GO
ALTER TABLE [dbo].[Exams] ADD  DEFAULT ((0)) FOR [IsPublished]
GO
ALTER TABLE [dbo].[Questions]  WITH CHECK ADD  CONSTRAINT [FK_Exam] FOREIGN KEY([ExamID])
REFERENCES [dbo].[Exams] ([ExamID])
GO
ALTER TABLE [dbo].[Questions] CHECK CONSTRAINT [FK_Exam]
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD CHECK  (([Role]='Student' OR [Role]='Teacher' OR [Role]='Admin'))
GO
