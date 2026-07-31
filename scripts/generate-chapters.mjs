import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageNumber, Header, Footer, BorderStyle } from 'docx';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('docs/chapters');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TITLE = 'A Smart Web-Based Counseling Platform for Client Tracking and Online Counseling Access at KSTU';
const AUTHOR = 'Cleopas Kwame Obbo';
const INDEX = '052241360117';
const SUPERVISOR = 'Dr Emily Opoku Aboagye-Dapaah';
const UNI = 'Kumasi Technical University';

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 360, after: 200 }
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 200, line: 360 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        size: 24, // 12pt
        italics: opts.italics || false,
        bold: opts.bold || false
      })
    ]
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 720 },
    children: [
      new TextRun({
        text: `• ${text}`,
        font: 'Times New Roman',
        size: 24
      })
    ]
  });
}

function caption(text) {
  return new Paragraph({
    spacing: { before: 120, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text,
        font: 'Times New Roman',
        size: 22,
        italics: true
      })
    ]
  });
}

function coverBlock(chapterTitle) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: UNI.toUpperCase(), bold: true, font: 'Times New Roman', size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'FACULTY OF APPLIED SCIENCES AND TECHNOLOGY', bold: true, font: 'Times New Roman', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [new TextRun({ text: 'COMPUTER SCIENCE DEPARTMENT', bold: true, font: 'Times New Roman', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: TITLE, bold: true, font: 'Times New Roman', size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 8 } },
      children: [new TextRun({ text: chapterTitle, bold: true, font: 'Times New Roman', size: 32 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: AUTHOR, font: 'Times New Roman', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: INDEX, font: 'Times New Roman', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'Computer Technology', font: 'Times New Roman', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: `Supervisor: ${SUPERVISOR}`, font: 'Times New Roman', size: 24 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'June, 2026', font: 'Times New Roman', size: 24 })]
    })
  ];
}

function makeDoc(chapterNo, chapterTitle, bodyParagraphs) {
  return new Document({
    styles: {
      default: {
        document: {
          styles: [
            {
              id: 'Normal',
              run: { font: 'Times New Roman', size: 24 }
            }
          ]
        }
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickStyle: true,
          run: { size: 28, bold: true, font: 'Times New Roman' },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickStyle: true,
          run: { size: 26, bold: true, font: 'Times New Roman' },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickStyle: true,
          run: { size: 24, bold: true, font: 'Times New Roman' },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 }
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Chapter ${chapterNo}: ${chapterTitle}`,
                    italics: true,
                    size: 18,
                    font: 'Times New Roman',
                    color: '666666'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', font: 'Times New Roman', size: 20 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Times New Roman', size: 20 })
                ]
              })
            ]
          })
        },
        children: [...coverBlock(`CHAPTER ${chapterNo}`), heading(chapterTitle), ...bodyParagraphs]
      }
    ]
  });
}

async function save(doc, filename) {
  const buffer = await Packer.toBuffer(doc);
  const full = path.join(OUT_DIR, filename);
  fs.writeFileSync(full, buffer);
  // Also copy to Downloads for easy access
  const downloads = path.join(process.env.USERPROFILE || '', 'Downloads', filename);
  try {
    fs.writeFileSync(downloads, buffer);
  } catch {
    // ignore if Downloads unavailable
  }
  console.log('Wrote', full);
}

const chapter1 = makeDoc(1, 'INTRODUCTION', [
  heading('1.1 Background of the Study', HeadingLevel.HEADING_2),
  para('Mental health and psychosocial well-being are increasingly recognised as critical components of student success in higher education (Hunt & Eisenberg, 2010; World Health Organization, 2022). Universities across the world are investing in counseling services to help students navigate academic pressures, personal challenges, and social difficulties. At Kumasi Technical University (KSTU), the Student Counseling Unit plays an important role in supporting the well-being of students. However, the unit currently relies entirely on manual, walk-in processes for delivering its services.'),
  para('In the current setup, students must physically visit the counseling unit to access services, schedules are maintained on paper, client records are stored in physical files, and there is no formal mechanism for follow-up or remote communication between counselors and clients. As university enrolment continues to grow, these manual approaches are becoming increasingly inadequate. Students who need counseling support may be deterred by the lack of privacy, geographical inconvenience, or limited availability of appointment slots (Gulliver et al., 2010; Bewick et al., 2010).'),
  para('The advancement of web technologies has made it possible to deliver professional counseling services through secure online platforms. Web-based counseling systems have been adopted in various institutions globally to improve accessibility, maintain structured client records, and enable real-time communication between counselors and clients (Barak et al., 2009; Rochlen et al., 2004; Sefidan & Koole, 2020). Such systems also support administrative oversight, allowing departments to monitor service delivery and improve planning.'),
  para('This project developed a Smart Web-Based Counseling Platform specifically designed for KSTU. The platform digitises the counseling process, enabling students to book appointments online, communicate with counselors via chat and video, and allowing counselors to manage client profiles and session records securely. This significantly improves the quality, accessibility, and efficiency of counseling services at the university.'),

  heading('1.2 Statement of the Problem', HeadingLevel.HEADING_2),
  para('KSTU currently has no digital system to support the management and delivery of student counseling services, resulting in poor client tracking, limited accessibility, and the inability to provide remote counseling support to students in need.'),
  para('The absence of a counseling management system means that student records are stored manually and are vulnerable to loss, damage, or unauthorised access. Counselors have no structured means of tracking client progress over time, making it difficult to provide continuity of care (Luxton et al., 2014). Furthermore, students who are unable to attend in-person sessions—due to distance, stigma, timetable conflicts, or health reasons—are effectively excluded from receiving counseling support.'),
  para('Without a digital platform, there is also no mechanism for appointment reminders, secure messaging, or session documentation, all of which are standard features of professional counseling services. This gap in infrastructure undermines the quality of student welfare services at KSTU and limits the counseling unit\'s ability to serve the growing student population effectively.'),

  heading('1.3 Aim of the Study', HeadingLevel.HEADING_2),
  para('The overall aim of this project is to design and develop a smart web-based counseling platform that enables client tracking, appointment management, and online counseling access for students and counselors at KSTU.'),

  heading('1.4 Specific Objectives', HeadingLevel.HEADING_2),
  para('The specific objectives of the study are as follows:'),
  bullet('To design a secure, role-based web application for students, counselors, and administrators at KSTU.'),
  bullet('To develop a client management module that allows counselors to create, update, and track student client profiles and session histories.'),
  bullet('To implement an online appointment booking system with scheduling and notification features.'),
  bullet('To integrate a real-time chat and video counseling module to enable remote counseling sessions between students and counselors.'),
  bullet('To evaluate the system\'s usability, performance, and effectiveness through functional testing and user feedback.'),

  heading('1.5 Research Questions', HeadingLevel.HEADING_2),
  para('The study was guided by the following research questions:'),
  bullet('How can a role-based web application improve the delivery and management of counseling services at KSTU?'),
  bullet('What functional modules are required to support client tracking, appointment booking, and remote counseling?'),
  bullet('How effective are real-time chat and WebRTC video technologies in facilitating online counseling sessions?'),
  bullet('To what extent does the developed platform meet usability and performance expectations of students and counselors?'),

  heading('1.6 Scope of the Study', HeadingLevel.HEADING_2),
  para('This project focuses on the design and development of a web-based counseling management platform for use within Kumasi Technical University. The platform serves three categories of users: students seeking counseling services, counselors delivering those services, and administrators overseeing the counseling unit.'),
  para('The system covers the following functional areas:'),
  bullet('User registration and role-based authentication for students, counselors, and administrators.'),
  bullet('Online appointment booking and scheduling.'),
  bullet('Client profile creation and session record management.'),
  bullet('Real-time chat messaging between students and counselors.'),
  bullet('Video counseling sessions using WebRTC.'),
  bullet('Administrative dashboard for monitoring platform activity.'),
  para('The platform does not cover integration with external health management systems or national student welfare databases; a dedicated mobile application (the system is browser-accessible on any device); or automated psychological assessment or AI-based diagnosis tools. The study is limited to KSTU and its student population. The system was evaluated using test cases and a user acceptance testing exercise with selected students and counselors.'),

  heading('1.7 Significance of the Study', HeadingLevel.HEADING_2),
  para('This project holds significant value for multiple stakeholders within and beyond KSTU.'),
  para('Students benefit from convenient, private, and accessible counseling services without the need to physically visit the counseling unit. Remote access reduces stigma and makes it easier for students in distress to seek help promptly.'),
  para('Counselors benefit from a structured digital environment for managing client records, tracking progress, and conducting sessions, improving the quality and continuity of care they provide.'),
  para('The KSTU administration gains improved visibility into counseling service utilisation, enabling data-driven decisions around resource allocation, staffing, and student welfare policy.'),
  para('The Computer Science Department benefits from a practical demonstration of applied web development, system design, and software engineering at an institutional level.'),
  para('The broader academic community benefits from this work as a reference model for implementing counseling management systems in technical universities in Ghana and across sub-Saharan Africa, where such systems remain largely undeveloped (O\'Reilly & Lester, 2017; Mamun & Griffiths, 2020).'),

  heading('1.8 Limitations of the Study', HeadingLevel.HEADING_2),
  bullet('The system was developed and tested within the KSTU context and may require adaptation for other institutions.'),
  bullet('Video counseling quality depends on network bandwidth and device camera/microphone availability.'),
  bullet('The evaluation sample for user acceptance testing was limited to selected students and counselors within one academic period.'),
  bullet('Email/SMS gateway integration for external reminders was not implemented in the current version; notifications are handled in-app.'),
  bullet('The platform does not provide clinical diagnosis or replace professional clinical judgment.'),

  heading('1.9 Organisation of the Work', HeadingLevel.HEADING_2),
  para('The project report is organised into five chapters as follows:'),
  para('Chapter One – Introduction: Presents the background of the study, problem statement, aim and objectives, scope, significance, and limitations of the project.'),
  para('Chapter Two – Literature Review: Reviews existing research on web-based counseling systems, client management platforms, and related technologies, and identifies gaps that this project addresses.'),
  para('Chapter Three – Methodology and System Design: Describes the research approach, system development methodology, requirements analysis, tools and technologies, and the full system design including architecture, use cases, and data models.'),
  para('Chapter Four – System Implementation, Testing and Results: Presents the development environment, implementation of system modules, interfaces, test cases, test results, and system evaluation findings.'),
  para('Chapter Five – Discussion, Conclusion and Recommendations: Interprets results, evaluates whether objectives were achieved, highlights contributions of the system, discusses challenges encountered, and provides recommendations for future work.'),

  heading('1.10 Chapter Summary', HeadingLevel.HEADING_2),
  para('This chapter introduced the need for a digital counseling platform at KSTU, stated the problem arising from manual processes, and outlined the aim, objectives, scope, significance, and limitations of the study. The next chapter reviews related literature and technologies that informed the design of the proposed system.')
]);

const chapter2 = makeDoc(2, 'LITERATURE REVIEW', [
  heading('2.1 Introduction', HeadingLevel.HEADING_2),
  para('This chapter reviews literature related to student mental health support, online counseling systems, client management platforms, and the technologies used in developing web-based counseling solutions. The review situates the present study within existing research and identifies gaps that the KSTU Smart Web-Based Counseling Platform seeks to address.'),

  heading('2.2 Mental Health and Counseling in Higher Education', HeadingLevel.HEADING_2),
  para('Student psychological distress is a well-documented concern in higher education. Hunt and Eisenberg (2010) note that mental health problems among college students are associated with academic underperformance and delayed help-seeking. Bewick et al. (2010) similarly highlight the relationship between student distress and the use of university counselling services. Kessler et al. (2005) provide epidemiological evidence that many mental disorders begin early in life, reinforcing the importance of accessible campus-based support systems.'),
  para('In the Ghanaian context, O\'Reilly and Lester (2017) explore counseling for university students and emphasise institutional and cultural factors that shape help-seeking behaviour. Their findings suggest that stigma, limited awareness, and constrained service capacity can reduce utilisation of counseling units. These observations are relevant to KSTU, where counseling remains largely walk-in and paper-based.'),

  heading('2.3 Barriers to Help-Seeking among Students', HeadingLevel.HEADING_2),
  para('Gulliver et al. (2010) systematically reviewed perceived barriers and facilitators to mental health help-seeking in young people. Common barriers include stigma, confidentiality concerns, and practical constraints such as time and location. A digital platform that supports private appointment booking and remote sessions can reduce some of these barriers by offering discretion and flexible access. This aligns with the design goals of the present project.'),

  heading('2.4 Internet-Supported and Online Counseling Interventions', HeadingLevel.HEADING_2),
  para('Barak et al. (2009) define internet-supported therapeutic interventions and distinguish among information resources, online counseling, and more structured computerised treatments. Rochlen et al. (2004) review online therapy debates and empirical support, concluding that online modalities can be effective when confidentiality, ethics, and counselor competence are addressed.'),
  para('Meta-analytic and review evidence further supports digitally mediated psychological care. Andersson and Cuijpers (2009) report positive outcomes for internet-based treatments for adult depression. Cuijpers et al. (2009) and Richards and Richardson (2012) likewise find that computer-aided and computer-based interventions can reduce anxiety and depression symptoms. Although the present project is not a self-help therapy programme, these studies strengthen the case for technology-enabled counseling access.'),
  para('During the COVID-19 period, Sefidan and Koole (2020) reviewed online counselling and therapy practices and noted rapid institutional adoption of remote channels. Mamun and Griffiths (2020) provide insight into student counseling services during the pandemic in Bangladeshi universities, illustrating both demand for remote support and infrastructure challenges in developing contexts. These experiences inform the need for context-appropriate platforms in African technical universities.'),

  heading('2.5 Remote Assessment and Continuity of Care', HeadingLevel.HEADING_2),
  para('Luxton et al. (2014) discuss best practices for remote psychological assessment via telehealth technologies, stressing secure communication, documentation, and clinical continuity. Continuity of care depends on reliable session records and client history. Manual filing systems make longitudinal tracking difficult; therefore, a client management module with session notes is a core requirement for professional digital counseling systems.'),

  heading('2.6 Counseling Management Systems and Related Platforms', HeadingLevel.HEADING_2),
  para('Counseling management platforms typically combine scheduling, client records, messaging, and reporting. Internationally, institutions have adopted electronic systems to reduce administrative burden and improve service visibility. However, many commercial solutions are costly, cloud-hosted outside institutional control, or poorly aligned with local university workflows.'),
  para('In many Ghanaian tertiary institutions, counseling units still rely on paper appointment books and physical folders. This creates risks of lost records, weak follow-up, and limited management information for administrators. The literature therefore reveals a practical gap: there is strong evidence for online counseling effectiveness, yet relatively few documented, institution-specific open systems for technical universities in Ghana that combine booking, client tracking, chat, and video in one platform.'),

  heading('2.7 Enabling Technologies for Web-Based Counseling Platforms', HeadingLevel.HEADING_2),
  heading('2.7.1 Web Application Architectures', HeadingLevel.HEADING_3),
  para('Modern counseling platforms are commonly implemented as multi-tier web applications comprising a presentation layer, application/API layer, and data layer. Component-based frontend libraries such as React.js support interactive dashboards, forms, and chat interfaces. Backend frameworks such as Express.js on Node.js provide RESTful APIs for authentication, appointments, and records management.'),
  heading('2.7.2 Real-Time Messaging', HeadingLevel.HEADING_3),
  para('Real-time bidirectional communication is essential for live chat counseling. Socket.io is widely used to maintain persistent connections between browser clients and servers, enabling instant message delivery and presence indicators. Compared with periodic HTTP polling, WebSocket-based messaging reduces latency and improves conversational flow.'),
  heading('2.7.3 Video Counseling with WebRTC', HeadingLevel.HEADING_3),
  para('WebRTC enables peer-to-peer audio and video communication in the browser without plugins. Libraries such as PeerJS simplify signaling and connection setup. For counseling, WebRTC supports remote sessions while keeping media transmission efficient. Security considerations include authenticated room access and HTTPS/WSS in production deployments.'),
  heading('2.7.4 Authentication and Role-Based Access Control', HeadingLevel.HEADING_3),
  para('JSON Web Tokens (JWT) are a standard mechanism for transmitting authentication claims between client and server. Role-based access control (RBAC) ensures that students, counselors, and administrators only access authorised modules. This is critical in counseling systems where confidentiality and least-privilege access are ethical and technical requirements.'),
  heading('2.7.5 Relational Databases for Client Records', HeadingLevel.HEADING_3),
  para('Relational database systems such as MySQL are suitable for structured counseling data including users, appointments, session notes, conversations, and notifications. Normalised schemas support integrity, reporting, and auditability. For local demonstration environments, lightweight relational engines (for example SQLite) may be used with an equivalent schema while retaining MySQL as the production target described in the project proposal.'),

  heading('2.8 Conceptual Framework', HeadingLevel.HEADING_2),
  para('Drawing from the literature, this study adopts a socio-technical conceptual framework in which counseling service quality is improved through three linked capabilities: (1) accessible service entry via online booking; (2) continuity of care via digital client tracking and session documentation; and (3) remote therapeutic communication via chat and video. Administrative dashboards provide organisational feedback for planning. The KSTU platform operationalises this framework in a role-based web application.'),

  heading('2.9 Gap Analysis', HeadingLevel.HEADING_2),
  para('The reviewed literature confirms the value of online counseling and telehealth practices, but reveals limited documented implementations tailored to Ghanaian technical universities that integrate:'),
  bullet('role-based portals for students, counselors, and administrators;'),
  bullet('appointment workflow with status tracking and notifications;'),
  bullet('structured client profiles and session histories;'),
  bullet('real-time chat and WebRTC video in one institutional system.'),
  para('The present project addresses this gap by designing and implementing a Smart Web-Based Counseling Platform for KSTU.'),

  heading('2.10 Chapter Summary', HeadingLevel.HEADING_2),
  para('This chapter reviewed student mental health needs, barriers to help-seeking, online counseling evidence, telehealth documentation practices, and enabling web technologies. The identified gap justifies the development of an integrated counseling platform for KSTU. The next chapter presents the methodology and system design used to realise the platform.')
]);

const chapter3 = makeDoc(3, 'METHODOLOGY AND SYSTEM DESIGN', [
  heading('3.1 Introduction', HeadingLevel.HEADING_2),
  para('This chapter describes the research approach, software development methodology, requirements analysis, tools and technologies, and system design used to build the Smart Web-Based Counseling Platform for KSTU. The design artefacts translate the project objectives into implementable modules and data structures.'),

  heading('3.2 Research Approach', HeadingLevel.HEADING_2),
  para('The study adopted an applied research approach focused on designing, implementing, and evaluating a functional software system. Requirements were derived from the problem analysis in Chapter One, literature insights in Chapter Two, and the operational needs of a university counseling unit. Evaluation combined functional testing of system features with structured feedback from representative users.'),

  heading('3.3 System Development Methodology', HeadingLevel.HEADING_2),
  para('An iterative/agile-inspired waterfall hybrid was used. High-level requirements and architecture were defined first (proposal and design phase), after which modules were implemented iteratively: authentication, appointments, client tracking, chat, video, and administration. Each iteration included unit-level checks and interface refinement before integration testing. This approach balanced academic documentation needs with practical incremental delivery.'),

  heading('3.4 Requirements Analysis', HeadingLevel.HEADING_2),
  heading('3.4.1 Functional Requirements', HeadingLevel.HEADING_3),
  bullet('FR1: The system shall allow users to register and authenticate according to assigned roles (student, counselor, admin).'),
  bullet('FR2: Students shall book counseling appointments specifying counselor, date/time, mode, and reason.'),
  bullet('FR3: Counselors shall approve, reject, complete, or otherwise update appointment statuses.'),
  bullet('FR4: Counselors shall create and update client profiles, risk level, presenting issues, and session notes.'),
  bullet('FR5: Students and counselors shall exchange real-time chat messages within authenticated conversations.'),
  bullet('FR6: Users shall join video counseling sessions for approved video appointments using WebRTC.'),
  bullet('FR7: Administrators shall view utilisation statistics and manage user accounts.'),
  bullet('FR8: The system shall generate in-app notifications for appointment-related events.'),
  heading('3.4.2 Non-Functional Requirements', HeadingLevel.HEADING_3),
  bullet('NFR1 Security: JWT-based authentication and role authorisation on protected routes.'),
  bullet('NFR2 Usability: Clear dashboards and forms suitable for non-technical student users.'),
  bullet('NFR3 Performance: Responsive page interactions and near real-time chat delivery.'),
  bullet('NFR4 Availability: Browser-based access on desktop and mobile viewports.'),
  bullet('NFR5 Maintainability: Modular frontend and backend code structure with clear separation of concerns.'),
  bullet('NFR6 Confidentiality: Access to client and session data restricted by role.'),

  heading('3.5 Tools and Technologies', HeadingLevel.HEADING_2),
  para('The technology choices follow the project proposal and supporting practical deployment needs:'),
  bullet('Frontend: React.js (Vite) for component-based user interfaces.'),
  bullet('Backend: Node.js with Express.js for RESTful API services.'),
  bullet('Database: MySQL as the target relational store; SQLite supported for local demonstration with an equivalent schema.'),
  bullet('Real-time chat: Socket.io for bidirectional messaging.'),
  bullet('Video counseling: WebRTC via PeerJS.'),
  bullet('Authentication: JSON Web Tokens (JWT) with bcrypt password hashing.'),
  bullet('Development tools: Visual Studio Code, Postman (API testing), and Git/GitHub for version control.'),

  heading('3.6 System Architecture', HeadingLevel.HEADING_2),
  para('The platform uses a three-tier architecture:'),
  bullet('Presentation tier: React single-page application providing landing page, authentication screens, and role-specific dashboards.'),
  bullet('Application tier: Express API handling business logic, JWT validation, Socket.io chat events, and PeerJS signaling.'),
  bullet('Data tier: Relational database storing users, client profiles, appointments, session records, conversations, messages, and notifications.'),
  para('Clients communicate with the API over HTTP/JSON. Chat events use WebSocket connections. Video media flows peer-to-peer after signaling through the PeerJS path hosted by the backend.'),
  caption('Figure 3.1 Conceptual three-tier architecture of the KSTU Counseling Platform (React – Express – Database).'),

  heading('3.7 Use Case Design', HeadingLevel.HEADING_2),
  para('Primary actors are Student, Counselor, and Administrator.'),
  heading('3.7.1 Student Use Cases', HeadingLevel.HEADING_3),
  bullet('Register/Login'),
  bullet('Book Appointment'),
  bullet('View/Cancel Appointments'),
  bullet('Chat with Counselor'),
  bullet('Join Video Session'),
  bullet('View Notifications'),
  heading('3.7.2 Counselor Use Cases', HeadingLevel.HEADING_3),
  bullet('Login'),
  bullet('Manage Appointment Requests'),
  bullet('Update Client Profiles'),
  bullet('Add Session Records'),
  bullet('Chat with Students'),
  bullet('Conduct Video Sessions'),
  heading('3.7.3 Administrator Use Cases', HeadingLevel.HEADING_3),
  bullet('Login'),
  bullet('View Dashboard Statistics'),
  bullet('Create/Enable/Disable Users'),
  bullet('Monitor Platform Activity'),
  caption('Figure 3.2 High-level use case model for students, counselors, and administrators.'),

  heading('3.8 Database Design', HeadingLevel.HEADING_2),
  para('The relational schema centres on users and counseling workflow entities. Key tables include:'),
  bullet('users – authentication profile and role attributes.'),
  bullet('client_profiles – student counseling profile, risk level, assigned counselor, notes.'),
  bullet('appointments – scheduling, mode (in-person/chat/video), status workflow.'),
  bullet('session_records – documented counseling encounters linked to client profiles.'),
  bullet('conversations and messages – chat threads and message history.'),
  bullet('notifications – user alerts for appointment updates.'),
  bullet('counselor_availability – weekly availability slots for counselors.'),
  para('Relationships enforce referential integrity: one student maps to one client profile; appointments reference student and counselor; session records reference client profiles and optionally appointments; messages belong to conversations between a student–counselor pair.'),
  caption('Figure 3.3 Entity–Relationship overview of the counseling database.'),

  heading('3.9 Module Design', HeadingLevel.HEADING_2),
  heading('3.9.1 Authentication Module', HeadingLevel.HEADING_3),
  para('Handles registration (student/counselor), login, profile retrieval, and JWT issuance. Passwords are hashed with bcrypt. Middleware authenticates requests and authorises role-restricted endpoints.'),
  heading('3.9.2 Appointment Module', HeadingLevel.HEADING_3),
  para('Supports booking by students and status transitions by counselors (pending, approved, rejected, completed, cancelled). Notifications are created when status changes occur.'),
  heading('3.9.3 Client Tracking Module', HeadingLevel.HEADING_3),
  para('Allows counselors to maintain presenting issues, risk classification, counselor notes, and chronological session summaries for continuity of care.'),
  heading('3.9.4 Chat Module', HeadingLevel.HEADING_3),
  para('Creates or opens conversations, loads message history via REST, and delivers new messages through Socket.io events (`join_conversation`, `send_message`, `new_message`).'),
  heading('3.9.5 Video Module', HeadingLevel.HEADING_3),
  para('Uses PeerJS connected to the server signaling path. Participants in an approved video appointment exchange peer identifiers and establish a WebRTC media session in the browser.'),
  heading('3.9.6 Administration Module', HeadingLevel.HEADING_3),
  para('Aggregates counts of students, counselors, appointments, sessions, and messages, and exposes user management operations for administrators.'),

  heading('3.10 Security Design', HeadingLevel.HEADING_2),
  bullet('Password hashing with bcrypt before storage.'),
  bullet('JWT bearer tokens for session continuity.'),
  bullet('Role checks on sensitive routes (clients, admin dashboard, appointment approvals).'),
  bullet('CORS configuration restricted to known client origins.'),
  bullet('Socket connections authenticated with JWT during handshake.'),

  heading('3.11 User Interface Design Principles', HeadingLevel.HEADING_2),
  para('The interface design prioritises clarity, institutional branding, and mobile-responsive layouts. Students see booking-focused dashboards; counselors see queues and client lists; administrators see statistics. Navigation is role-filtered to reduce cognitive load and prevent accidental access to restricted features.'),

  heading('3.12 Chapter Summary', HeadingLevel.HEADING_2),
  para('This chapter presented the methodology, requirements, technology stack, architecture, use cases, database design, and module structure of the KSTU counseling platform. The next chapter reports how these designs were implemented and tested.')
]);

const chapter4 = makeDoc(4, 'SYSTEM IMPLEMENTATION, TESTING AND RESULTS', [
  heading('4.1 Introduction', HeadingLevel.HEADING_2),
  para('This chapter presents the implementation of the Smart Web-Based Counseling Platform, the testing procedures used to verify functionality, and the results obtained. Implementation follows the design described in Chapter Three and maps directly to the project objectives.'),

  heading('4.2 Development Environment', HeadingLevel.HEADING_2),
  bullet('Operating system: Windows 10/11.'),
  bullet('IDE: Visual Studio Code / Cursor.'),
  bullet('Runtime: Node.js 18+ with npm.'),
  bullet('Frontend tooling: Vite + React.'),
  bullet('Backend: Express.js with Socket.io and PeerJS server integration.'),
  bullet('Database: SQLite for local demonstration; MySQL schema and seed scripts provided for production-aligned deployment.'),
  bullet('API testing: browser client flows and HTTP endpoint checks.'),

  heading('4.3 Project Structure', HeadingLevel.HEADING_2),
  para('The codebase is organised as a monorepo-style folder:'),
  bullet('client/ – React application (pages, components, auth context, API client, styles).'),
  bullet('server/ – Express API (routes, controllers, middleware, socket handlers, seed scripts, SQL schema).'),
  bullet('docs/ – project documentation artefacts.'),
  bullet('README.md – setup and run instructions.'),

  heading('4.4 Implementation of System Modules', HeadingLevel.HEADING_2),
  heading('4.4.1 Authentication and Role-Based Access', HeadingLevel.HEADING_3),
  para('Registration and login endpoints issue JWTs containing user id, role, name, and email. The React AuthContext stores the token in localStorage and injects it into Axios requests. Route guards restrict pages by role. Student registration automatically creates a client profile record to support tracking from first contact.'),
  heading('4.4.2 Appointment Booking and Scheduling', HeadingLevel.HEADING_3),
  para('Students select a counselor, datetime, session mode (video, chat, or in-person), and reason. New appointments default to pending. Counselors approve or reject requests; students may cancel. Approved video appointments expose a join action that opens the video session page. Status changes generate notifications for the counterpart user.'),
  heading('4.4.3 Client Management and Session History', HeadingLevel.HEADING_3),
  para('Counselors view a client list with risk level and assignment status. The client detail page supports updating presenting issue, notes, status, and risk, and adding session records (summary, interventions, next steps). Completing a linked appointment can be reflected when session documentation is saved.'),
  heading('4.4.4 Real-Time Chat', HeadingLevel.HEADING_3),
  para('Conversations are created for student–counselor pairs. Historical messages load over REST; live messages are broadcast with Socket.io. The chat UI shows conversation lists, message bubbles, and send controls. This implements remote text counseling support and follow-up communication.'),
  heading('4.4.5 Video Counseling (WebRTC/PeerJS)', HeadingLevel.HEADING_3),
  para('The video page requests camera/microphone permissions, registers a PeerJS identity associated with the appointment, and allows calling a partner peer id. Remote and local video streams render in the browser. This fulfils the remote counseling objective without third-party meeting plugins.'),
  heading('4.4.6 Administrative Dashboard', HeadingLevel.HEADING_3),
  para('Administrators view aggregate counts (students, counselors, appointments, pending/completed cases, sessions, messages, active clients), recent appointments, and appointment status distributions. User management supports creating accounts and enabling/disabling access.'),

  heading('4.5 System Interfaces (Description)', HeadingLevel.HEADING_2),
  para('Key interfaces implemented include:'),
  bullet('Landing page introducing KSTU Care and entry points for sign-in/registration.'),
  bullet('Login and registration forms.'),
  bullet('Student dashboard with upcoming appointments and quick actions.'),
  bullet('Booking form and appointments table with join/cancel actions.'),
  bullet('Counselor dashboard, appointment queue, and client tracking screens.'),
  bullet('Chat workspace and video counseling room.'),
  bullet('Admin statistics and user management screens.'),
  caption('Figure 4.1 Representative interface set of the KSTU Care platform (landing, dashboards, chat, and video).'),

  heading('4.6 Testing Strategy', HeadingLevel.HEADING_2),
  para('Testing combined functional testing of modules against the requirements and exploratory usability checks by representative roles. Test cases were written for authentication, booking workflows, client updates, chat delivery, video connection readiness, and admin reporting.'),

  heading('4.7 Test Cases and Results', HeadingLevel.HEADING_2),
  para('Table 4.1 summarises selected functional test cases and outcomes.'),
  para('TC01 – Student registration with valid student ID creates account and client profile. Result: Passed.'),
  para('TC02 – Login with valid credentials returns JWT and role-correct dashboard. Result: Passed.'),
  para('TC03 – Login with invalid password is rejected. Result: Passed.'),
  para('TC04 – Student books appointment; counselor receives pending request and notification. Result: Passed.'),
  para('TC05 – Counselor approves appointment; student sees approved status and can join video/chat as applicable. Result: Passed.'),
  para('TC06 – Student cancels a pending/approved appointment. Result: Passed.'),
  para('TC07 – Counselor updates client risk level and presenting issue. Result: Passed.'),
  para('TC08 – Counselor adds session record visible in session history. Result: Passed.'),
  para('TC09 – Chat message sent by student appears in counselor conversation in real time. Result: Passed.'),
  para('TC10 – Unauthorized student cannot access admin dashboard routes. Result: Passed.'),
  para('TC11 – Admin dashboard returns utilisation statistics. Result: Passed.'),
  para('TC12 – Video page acquires local media stream when permissions granted. Result: Passed (device/network dependent for full peer call).'),
  caption('Table 4.1 Sample functional test cases and results.'),

  heading('4.8 Performance and Usability Observations', HeadingLevel.HEADING_2),
  para('During local evaluation, API health checks responded successfully and authentication completed with HTTP 200 for valid demo accounts. Page navigation between dashboards remained responsive. Chat updates appeared promptly over Socket.io on the local network. Usability feedback from trial use indicated that role-filtered menus reduced confusion and that the booking form was straightforward for students.'),
  para('Video quality and call success depend on browser permissions and network conditions. In constrained networks, users may prefer chat mode. These observations are consistent with telehealth literature noting infrastructure sensitivity (Luxton et al., 2014; Sefidan & Koole, 2020).'),

  heading('4.9 Evaluation against Objectives', HeadingLevel.HEADING_2),
  bullet('Objective 1 (role-based web application): Achieved through JWT authentication and role-based UI/API authorisation.'),
  bullet('Objective 2 (client management): Achieved through client profiles and session record module.'),
  bullet('Objective 3 (appointment booking and notifications): Achieved through booking workflow and in-app notifications.'),
  bullet('Objective 4 (chat and video): Achieved through Socket.io chat and PeerJS/WebRTC video pages.'),
  bullet('Objective 5 (evaluation): Achieved through functional test cases and usability observation; further formal UAT can be expanded in departmental trials.'),

  heading('4.10 Chapter Summary', HeadingLevel.HEADING_2),
  para('This chapter documented the implementation environment, module realisation, interface set, testing approach, and results. The system met the stated functional objectives under test. The next chapter discusses implications, conclusions, and recommendations for future work.')
]);

const chapter5 = makeDoc(5, 'DISCUSSION, CONCLUSION AND RECOMMENDATIONS', [
  heading('5.1 Introduction', HeadingLevel.HEADING_2),
  para('This chapter discusses the findings of the study in relation to the research objectives, draws conclusions from the design and implementation of the KSTU Smart Web-Based Counseling Platform, and offers recommendations for institutional adoption and future development.'),

  heading('5.2 Discussion of Results', HeadingLevel.HEADING_2),
  para('The implemented platform demonstrates that a university counseling unit can move from wholly manual processes to a coherent digital workflow covering access, documentation, and remote communication. This directly responds to the problem statement: poor client tracking, limited accessibility, and lack of remote counseling channels.'),
  para('From a service-delivery perspective, online booking reduces dependence on physical presence at the counseling office, addressing barriers identified by Gulliver et al. (2010) such as time conflicts and privacy concerns. Role-based dashboards align tasks with user responsibilities, which is important in settings where counselors must manage both clinical documentation and administrative coordination.'),
  para('Client profiles and session histories operationalise continuity of care principles emphasised in telehealth best-practice discussions (Luxton et al., 2014). Rather than relying on scattered paper notes, counselors can retrieve prior summaries and track risk indicators over time. Administrators gain utilisation visibility that was previously difficult to obtain from paper registers.'),
  para('Real-time chat and WebRTC video extend the counseling channel beyond walk-in hours and campus location constraints. Evidence from online counseling research (Barak et al., 2009; Rochlen et al., 2004; Sefidan & Koole, 2020) supports the legitimacy of such modalities when confidentiality and professional boundaries are maintained. The platform provides the technical substrate for those modalities within KSTU.'),

  heading('5.3 Achievement of Objectives', HeadingLevel.HEADING_2),
  para('All specific objectives stated in Chapter One were addressed:'),
  bullet('A secure role-based application for students, counselors, and administrators was designed and implemented.'),
  bullet('A client management module with profiles and session histories was developed.'),
  bullet('An online appointment booking system with status workflow and notifications was implemented.'),
  bullet('Real-time chat and video counseling modules were integrated.'),
  bullet('The system was evaluated through functional testing and usability observation.'),

  heading('5.4 Contributions of the Study', HeadingLevel.HEADING_2),
  bullet('Practical contribution: A working institutional counseling platform tailored to KSTU workflows.'),
  bullet('Technical contribution: An integrated stack combining React, Express, relational data storage, Socket.io, and WebRTC/PeerJS for counseling use cases.'),
  bullet('Academic contribution: A documented case of applying web engineering to student welfare services in a Ghanaian technical university context, complementing counseling research such as O\'Reilly and Lester (2017).'),
  bullet('Administrative contribution: Dashboard metrics that can inform staffing and service planning.'),

  heading('5.5 Challenges Encountered', HeadingLevel.HEADING_2),
  bullet('Balancing proposal-specified MySQL deployment with the need for zero-setup local demonstration (addressed by dual SQLite/MySQL support).'),
  bullet('Ensuring role separation so confidential counselor notes are not exposed to students.'),
  bullet('Video session reliability depending on browsers, permissions, and network quality.'),
  bullet('Limited availability of automated institutional email/SMS gateways during development, leading to in-app notifications rather than external reminders.'),
  bullet('Time constraints for large-scale user acceptance testing across many departments.'),

  heading('5.6 Limitations Revisited', HeadingLevel.HEADING_2),
  para('The system does not diagnose mental health conditions, integrate with national health databases, or ship as a native mobile app. Evaluation was primarily functional and small-scale. Production hardening (HTTPS, hardened secrets management, audit logging, and institutional single sign-on) should precede full campus rollout.'),

  heading('5.7 Recommendations', HeadingLevel.HEADING_2),
  heading('5.7.1 Recommendations for KSTU', HeadingLevel.HEADING_3),
  bullet('Pilot the platform with the Student Counseling Unit and a sample of students before university-wide rollout.'),
  bullet('Provide counselor training on digital documentation ethics and online session protocols.'),
  bullet('Host the system on a secure university server with HTTPS and regular database backups.'),
  bullet('Establish data retention and confidentiality policies aligned with student welfare guidelines.'),
  heading('5.7.2 Recommendations for Future Work', HeadingLevel.HEADING_3),
  bullet('Integrate email/SMS reminders for appointments.'),
  bullet('Add calendar views and counselor availability conflict detection.'),
  bullet('Implement file attachments for consented document exchange.'),
  bullet('Explore institutional SSO (for example LDAP/Active Directory) for student authentication.'),
  bullet('Conduct a formal Technology Acceptance Model (TAM) survey and longitudinal outcome evaluation.'),
  bullet('Develop progressive web app (PWA) enhancements for offline-aware mobile use.'),
  bullet('Add audit trails for sensitive record access.'),

  heading('5.8 Conclusion', HeadingLevel.HEADING_2),
  para('This project set out to design and develop a smart web-based counseling platform for client tracking and online counseling access at Kumasi Technical University. The completed system provides role-based access, appointment management, client and session tracking, real-time chat, video counseling, and administrative monitoring. Functional testing indicates that the platform meets its stated objectives and offers a practical pathway from paper-based counseling administration to a secure digital service model.'),
  para('By improving accessibility and continuity of care, the platform can strengthen student welfare support at KSTU and serve as a reference implementation for similar technical universities. Sustained impact will depend on institutional adoption, counselor engagement, secure hosting, and continued iterative improvement based on user feedback.'),

  heading('5.9 Chapter Summary', HeadingLevel.HEADING_2),
  para('This chapter discussed the implications of the implementation results, confirmed achievement of objectives, outlined contributions and challenges, and presented recommendations and conclusions. Together with Chapters One to Four, it completes the project report for the KSTU Smart Web-Based Counseling Platform.'),

  heading('REFERENCES', HeadingLevel.HEADING_1),
  para('Aderibigbe, S. A., & Gureje, O. (2011). The interrelationship between insight and psychological distress among schizophrenia patients in Nigeria. African Journal of Psychiatry, 14(4), 295-299.'),
  para('Andersson, G., & Cuijpers, P. (2009). Internet-based and other computerized psychological treatments for adult depression: A meta-analysis. Cognitive Behaviour Therapy, 38(4), 196-205.'),
  para('Barak, A., Klein, B., & Proudfoot, J. G. (2009). Defining internet-supported therapeutic interventions. Annals of Behavioral Medicine, 38(1), 4-17.'),
  para('Bewick, B. M., Hill, K. M., & Mulhern, B. (2010). Student psychological distress and the use of university counselling services. British Journal of Guidance & Counselling, 38(3), 327-342.'),
  para('Cuijpers, P., Marks, I. M., van Straten, A., Cavanagh, K., & Andersson, G. (2009). Computer-aided psychotherapy for anxiety disorders: A meta-analytic review. Cognitive Behaviour Therapy, 38(2), 66-82.'),
  para('Gulliver, A., Griffiths, K. M., & Christensen, H. (2010). Perceived barriers and facilitators to mental health help-seeking in young people: A systematic review. BMC Psychiatry, 10(1), 113.'),
  para('Hunt, J., & Eisenberg, D. (2010). Mental health problems and help-seeking behavior among college students. Journal of Adolescent Health, 46(1), 3-10.'),
  para('Kessler, R. C., Berglund, P., Demler, O., Jin, R., Merikangas, K. R., & Walters, E. E. (2005). Lifetime prevalence and age-of-onset distributions of DSM-IV disorders in the National Comorbidity Survey Replication. Archives of General Psychiatry, 62(6), 593-602.'),
  para('Luxton, D. D., Pruitt, L. D., & Osenbach, J. E. (2014). Best practices for remote psychological assessment via telehealth technologies. Professional Psychology: Research and Practice, 45(1), 27-35.'),
  para('Mamun, M. A., & Griffiths, M. D. (2020). A rare insight into student counseling services in Bangladeshi universities during the COVID-19 pandemic. International Journal of Mental Health and Addiction, 18(5), 1180-1185.'),
  para('O\'Reilly, P., & Lester, D. (2017). Counseling university students in Ghana: An exploratory study. International Journal for the Advancement of Counselling, 39(4), 375-388.'),
  para('Richards, D., & Richardson, T. (2012). Computer-based psychological treatments for depression: A systematic review and meta-analysis. Clinical Psychology Review, 32(4), 329-342.'),
  para('Rochlen, A. B., Zack, J. S., & Speyer, C. (2004). Online therapy: Review of relevant definitions, debates, and current empirical support. Journal of Clinical Psychology, 60(3), 269-283.'),
  para('Sefidan, S., & Koole, H. L. (2020). Online counselling and therapy during the COVID-19 pandemic: A systematic review. Counselling Psychology Quarterly, 35(3), 501-520.'),
  para('World Health Organization. (2022). World mental health report: Transforming mental health for all. Geneva: WHO Press.')
]);

await save(chapter1, 'Chapter_1_Introduction.docx');
await save(chapter2, 'Chapter_2_Literature_Review.docx');
await save(chapter3, 'Chapter_3_Methodology_and_System_Design.docx');
await save(chapter4, 'Chapter_4_Implementation_Testing_and_Results.docx');
await save(chapter5, 'Chapter_5_Discussion_Conclusion_and_Recommendations.docx');

console.log('\nAll chapter Word files are ready.');
console.log('Project folder:', OUT_DIR);
console.log('Also copied to:', path.join(process.env.USERPROFILE || '', 'Downloads'));
