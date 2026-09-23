import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Matter from 'matter-js';
import {
  Compass,
  Bell,
  MessageCircle,
  Bookmark,
  User,
  Search,
  Zap,
  RotateCcw,
  PlusCircle,
  Power,
  Sparkles,
  Layers,
  Sliders,
  Play,
  Pause,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

const COLORS = [
  '#38bdf8', // Sky
  '#818cf8', // Indigo
  '#f472b6', // Pink
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#a78bfa', // Purple
  '#fb7185', // Rose
  '#2dd4bf', // Teal
];

export default function AntigravitySimPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Canvas & Simulation references
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const renderRef = useRef(null);
  const mouseConstraintRef = useRef(null);
  const pulseEffectRef = useRef(0);

  // Settings State
  const [ambientGravity, setAmbientGravity] = useState(1.0);
  const [fieldRadius, setFieldRadius] = useState(130);
  const [fieldStrength, setFieldStrength] = useState(-0.02); // Negative value (phản trọng lực)
  const [isFieldActive, setIsFieldActive] = useState(true);

  // Interactive mouse position relative to canvas
  const mousePosRef = useRef({ x: -1000, y: -1000, isInside: false });
  const [objectCount, setObjectCount] = useState(0);

  // Search input state for Left Column
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize state with refs for fast Matter.js loop access
  const stateRef = useRef({
    ambientGravity: 1.0,
    fieldRadius: 130,
    fieldStrength: -0.02,
    isFieldActive: true
  });

  useEffect(() => {
    stateRef.current = {
      ambientGravity,
      fieldRadius,
      fieldStrength,
      isFieldActive
    };
    if (engineRef.current) {
      engineRef.current.gravity.y = ambientGravity;
    }
  }, [ambientGravity, fieldRadius, fieldStrength, isFieldActive]);

  // Khởi tạo Matter.js World & Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
      Events,
      Body
    } = Matter;

    const width = canvas.parentElement.clientWidth || 640;
    const height = Math.max(520, window.innerHeight - 150);

    canvas.width = width;
    canvas.height = height;

    // 1. Tạo Engine
    const engine = Engine.create({
      gravity: { x: 0, y: ambientGravity, scale: 0.001 }
    });
    engineRef.current = engine;

    // 2. Tạo Render
    const render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#ffffff',
        showVelocity: false
      }
    });
    renderRef.current = render;

    // 3. Tạo Tường & Sàn cố định
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: '#e2e8f0',
        strokeStyle: '#cbd5e1',
        lineWidth: 1
      },
      friction: 0.8,
      restitution: 0.4
    };

    const wallThickness = 60;
    const ground = Bodies.rectangle(width / 2, height + wallThickness / 2 - 10, width * 2, wallThickness, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2 + 10, width * 2, wallThickness, wallOptions);
    const leftWall = Bodies.rectangle(-wallThickness / 2 + 10, height / 2, wallThickness, height * 2, wallOptions);
    const rightWall = Bodies.rectangle(width + wallThickness / 2 - 10, height / 2, wallThickness, height * 2, wallOptions);

    ground.isBarrier = true;
    ceiling.isBarrier = true;
    leftWall.isBarrier = true;
    rightWall.isBarrier = true;

    // 4. Hàm sinh các vật thể mặc định
    const spawnInitialBodies = () => {
      const bodies = [];

      // Một vài khối hộp
      for (let i = 0; i < 7; i++) {
        const size = 36 + Math.floor(Math.random() * 28);
        const x = width / 2 - 140 + (i % 4) * 80 + (Math.random() * 30);
        const y = height - 120 - Math.floor(i / 4) * 70;
        const color = COLORS[i % COLORS.length];

        const box = Bodies.rectangle(x, y, size, size, {
          restitution: 0.65,
          friction: 0.3,
          density: 0.002,
          render: {
            fillStyle: color,
            strokeStyle: 'rgba(255, 255, 255, 0.8)',
            lineWidth: 2
          }
        });
        bodies.push(box);
      }

      // Một quả bóng lớn & một vài quả bóng nhỏ
      const bigBall = Bodies.circle(width / 2 + 80, height - 160, 32, {
        restitution: 0.85,
        friction: 0.1,
        density: 0.0015,
        render: {
          fillStyle: '#f43f5e',
          strokeStyle: '#ffffff',
          lineWidth: 2
        }
      });
      bodies.push(bigBall);

      for (let j = 0; j < 4; j++) {
        const radius = 18 + Math.random() * 12;
        const ball = Bodies.circle(width / 2 - 80 + j * 50, height - 240, radius, {
          restitution: 0.88,
          friction: 0.15,
          render: {
            fillStyle: COLORS[(j + 2) % COLORS.length],
            strokeStyle: '#ffffff',
            lineWidth: 2
          }
        });
        bodies.push(ball);
      }

      // Khối đa giác (Tam giác / Ngũ giác)
      const polygon1 = Bodies.polygon(width / 2, height - 280, 5, 28, {
        restitution: 0.6,
        render: {
          fillStyle: '#8b5cf6',
          strokeStyle: '#ffffff',
          lineWidth: 2
        }
      });
      bodies.push(polygon1);

      return bodies;
    };

    const initialBodies = spawnInitialBodies();
    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall, ...initialBodies]);
    setObjectCount(initialBodies.length);

    // 5. Chuột và MouseConstraint để tương tác kéo thả vật thể
    const mouse = Mouse.create(canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: true,
          lineWidth: 2,
          strokeStyle: '#38bdf8'
        }
      }
    });
    mouseConstraintRef.current = mouseConstraint;
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // 6. Hook BeforeUpdate: Áp dụng Lực Kháng Trọng Lực khi chuột ở gần
    Events.on(engine, 'beforeUpdate', () => {
      const { fieldRadius: rad, fieldStrength: str, isFieldActive: active } = stateRef.current;
      const { x: mx, y: my, isInside } = mousePosRef.current;

      if (!active || !isInside) return;

      const allBodies = Composite.allBodies(engine.world);

      allBodies.forEach(body => {
        if (body.isStatic || body.isBarrier) return;

        const dx = body.position.x - mx;
        const dy = body.position.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < rad) {
          // Lực tỷ lệ nghịch với khoảng cách (gần tâm lực mạnh hơn)
          const factor = Math.max(0, 1 - dist / rad);
          
          // Áp dụng lực âm mạnh đẩy lên trên (y âm) và nhẹ sang hai bên tạo độ xoáy tự nhiên
          const forceY = str * factor * body.mass;
          const forceX = (dx / (dist || 1)) * Math.abs(str) * 0.4 * factor * body.mass;

          Body.applyForce(body, body.position, {
            x: forceX,
            y: forceY
          });

          // Làm chậm nhẹ vận tốc rơi để vật thể lơ lửng bồng bềnh
          Body.setVelocity(body, {
            x: body.velocity.x * 0.98,
            y: body.velocity.y * 0.95
          });
        }
      });
    });

    // 7. Hook AfterRender: Vẽ trực quan "Trường Kháng Trọng lực" hình tròn mờ & hiệu ứng mạch đập
    Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      if (!ctx) return;

      const { fieldRadius: rad, isFieldActive: active } = stateRef.current;
      const { x: mx, y: my, isInside } = mousePosRef.current;

      if (!active || !isInside) return;

      // Pulse animation effect
      pulseEffectRef.current += 0.05;
      const pulseDelta = Math.sin(pulseEffectRef.current) * 6;
      const currentRadius = Math.max(10, rad + pulseDelta);

      ctx.save();

      // Radial Glow Gradient
      const grad = ctx.createRadialGradient(mx, my, currentRadius * 0.1, mx, my, currentRadius);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.5, 'rgba(129, 140, 248, 0.25)');
      grad.addColorStop(0.85, 'rgba(168, 85, 247, 0.12)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Glowing Ring
      ctx.beginPath();
      ctx.arc(mx, my, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();

      // Inner Antigravity Core
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.fill();

      // Text label indicating Antigravity Force
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText('TRƯỜNG KHÁNG TRỌNG LỰC', mx, my - currentRadius - 8);

      ctx.restore();
    });

    // 8. Chạy Render & Runner
    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Event listener cho canvas resize & mouse tracking
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isInside: true
      };
    };

    const handleMouseLeave = () => {
      mousePosRef.current.isInside = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const newWidth = canvas.parentElement.clientWidth;
      const newHeight = Math.max(520, window.innerHeight - 150);
      canvas.width = newWidth;
      canvas.height = newHeight;
      render.options.width = newWidth;
      render.options.height = newHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  // Nút: Thêm Vật thể mới
  const handleAddObject = () => {
    if (!engineRef.current || !canvasRef.current) return;
    const { Bodies, Composite } = Matter;
    const width = canvasRef.current.width;

    const x = width / 2 - 80 + Math.random() * 160;
    const y = 50 + Math.random() * 60;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shapeType = Math.floor(Math.random() * 3);

    let newBody;
    if (shapeType === 0) {
      // Circle
      const r = 18 + Math.floor(Math.random() * 18);
      newBody = Bodies.circle(x, y, r, {
        restitution: 0.8,
        friction: 0.2,
        render: { fillStyle: color, strokeStyle: '#ffffff', lineWidth: 2 }
      });
    } else if (shapeType === 1) {
      // Box
      const size = 32 + Math.floor(Math.random() * 24);
      newBody = Bodies.rectangle(x, y, size, size, {
        restitution: 0.6,
        friction: 0.3,
        render: { fillStyle: color, strokeStyle: '#ffffff', lineWidth: 2 }
      });
    } else {
      // Polygon (Tam giác hoặc Ngũ giác)
      const sides = Math.random() > 0.5 ? 3 : 5;
      newBody = Bodies.polygon(x, y, sides, 26, {
        restitution: 0.7,
        render: { fillStyle: color, strokeStyle: '#ffffff', lineWidth: 2 }
      });
    }

    Composite.add(engineRef.current.world, newBody);
    const nonBarriers = Composite.allBodies(engineRef.current.world).filter(b => !b.isBarrier);
    setObjectCount(nonBarriers.length);
  };

  // Nút: Reset Thế giới
  const handleResetWorld = () => {
    if (!engineRef.current || !canvasRef.current) return;
    const { Composite, Bodies } = Matter;
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Giữ lại 4 bức tường, xóa các vật thể tự do
    const all = Composite.allBodies(engineRef.current.world);
    const dynamicBodies = all.filter(b => !b.isBarrier);
    dynamicBodies.forEach(b => Composite.remove(engineRef.current.world, b));

    // Tạo lại các khối mặc định ban đầu
    const newBodies = [];
    for (let i = 0; i < 7; i++) {
      const size = 36 + Math.floor(Math.random() * 28);
      const x = width / 2 - 140 + (i % 4) * 80 + (Math.random() * 30);
      const y = height - 120 - Math.floor(i / 4) * 70;
      const color = COLORS[i % COLORS.length];

      newBodies.push(
        Bodies.rectangle(x, y, size, size, {
          restitution: 0.65,
          friction: 0.3,
          render: { fillStyle: color, strokeStyle: '#ffffff', lineWidth: 2 }
        })
      );
    }

    newBodies.push(
      Bodies.circle(width / 2 + 80, height - 160, 32, {
        restitution: 0.85,
        render: { fillStyle: '#f43f5e', strokeStyle: '#ffffff', lineWidth: 2 }
      })
    );

    for (let j = 0; j < 4; j++) {
      newBodies.push(
        Bodies.circle(width / 2 - 80 + j * 50, height - 240, 20 + Math.random() * 10, {
          restitution: 0.88,
          render: { fillStyle: COLORS[(j + 2) % COLORS.length], strokeStyle: '#ffffff', lineWidth: 2 }
        })
      );
    }

    Composite.add(engineRef.current.world, newBodies);
    setObjectCount(newBodies.length);
  };

  // Nút: "Khởi động Antigravity Sim" (tạo đợt sóng xung kích đẩy toàn bộ vật thể lên trời)
  const handleLaunchPulse = () => {
    if (!engineRef.current || !canvasRef.current) return;
    const { Composite, Body } = Matter;
    const bodies = Composite.allBodies(engineRef.current.world).filter(b => !b.isBarrier);
    
    setIsFieldActive(true);
    bodies.forEach(body => {
      const impulseY = -0.04 - Math.random() * 0.03;
      const impulseX = (Math.random() - 0.5) * 0.03;
      Body.applyForce(body, body.position, {
        x: impulseX * body.mass,
        y: impulseY * body.mass
      });
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc', // Màu nền sáng, tối giản, thanh lịch
      color: '#1e293b',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Top Banner Navigation Header */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Trở về NovaGen</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isFieldActive ? '#22c55e' : '#94a3b8',
              boxShadow: isFieldActive ? '0 0 10px #22c55e' : 'none'
            }} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
              Mô phỏng Kháng Trọng lực Matter.js
            </span>
          </div>
        </div>

        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar user={currentUser} size={32} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
              {currentUser.username}
            </span>
          </div>
        )}
      </header>

      {/* KHUNG BỐ CỤC 3 CỘT CỐ ĐỊNH (FIXED 3-COLUMN VIEW) */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: '260px 1fr 320px',
        gap: '24px',
        alignItems: 'start'
      }}>

        {/* ======================================================== */}
        {/* CỘT 1: MENU TRÁI (LEFT SIDEBAR)                         */}
        {/* ======================================================== */}
        <aside style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          position: 'sticky',
          top: '80px'
        }}>
          {/* Logo "N" NovaGen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingLeft: '6px' }}>
            <img
              src="/novagen-icon.jpg"
              alt="NovaGen"
              style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }}
            />
            <div>
              <span style={{
                fontSize: '18px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                NovaGen
              </span>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                Antigravity Physics Lab
              </div>
            </div>
          </div>

          {/* Thanh tìm kiếm ở trên cùng bên trái */}
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '13px',
                color: '#1e293b',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Danh sách menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Khám phá', icon: Compass, to: '/explore' },
              { label: 'Thông báo', icon: Bell, to: '/notifications' },
              { label: 'Tin nhắn', icon: MessageCircle, to: '/messages' },
              { label: 'Đã lưu', icon: Bookmark, to: '/saved-posts' },
              { label: 'Trang cá nhân', icon: User, to: '/profile' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0284c7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* NÚT THAY THẾ "TẠO BÀI VIẾT": "KHỞI ĐỘNG ANTIGRAVITY SIM" */}
          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleLaunchPulse}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.35)'; }}
            >
              <Zap size={18} />
              <span>Khởi động Antigravity Sim</span>
            </button>
            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '8px' }}>
              ⚡ Bấm để kích hoạt sóng lực đẩy phản trọng lực!
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* CỘT 2: KHU VỰC MÔ PHỎNG (MATTER.JS CANVAS PHYSICS AREA)    */}
        {/* ======================================================== */}
        <main style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header buồng mô phỏng */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fafbfc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#0284c7" />
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Khu vực Thử nghiệm Vật lý 2D (Matter.js)
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: isFieldActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: isFieldActive ? '#15803d' : '#b91c1c',
                fontWeight: '700'
              }}>
                {isFieldActive ? 'Trường Lực Đang BẬT 🟢' : 'Trường Lực TẮT ⚪'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Vật thể: <strong>{objectCount}</strong>
              </span>
            </div>
          </div>

          {/* Khung Canvas Matter.js */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '520px',
            background: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)',
            cursor: isFieldActive ? 'crosshair' : 'default',
            overflow: 'hidden'
          }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

            {/* Helper overlay hints */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '16px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '11.5px',
              color: '#64748b',
              pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              💡 <strong>Mẹo:</strong> Rê chuột qua các vật thể để nâng chúng lên. Click & kéo vật thể để ném!
            </div>
          </div>
        </main>

        {/* ======================================================== */}
        {/* CỘT 3: BẢNG ĐIỀU KHIỂN (CONTROL PANEL CARDS)             */}
        {/* ======================================================== */}
        <aside style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'sticky',
          top: '80px'
        }}>

          {/* THẺ 1: CÀI ĐẶT KHÁNG TRỌNG LỰC */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sliders size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Cài đặt Kháng Trọng lực
              </h3>
            </div>

            {/* Slider 1: Trọng lực Môi trường (Ambient Gravity) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#475569', fontWeight: '600' }}>Trọng lực Môi trường:</span>
                <span style={{ color: '#0284c7', fontWeight: '700' }}>{ambientGravity.toFixed(2)}G</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.05"
                value={ambientGravity}
                onChange={e => setAmbientGravity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <span>0.0 (Không trọng lượng)</span>
                <span>2.5 (Siêu trọng lượng)</span>
              </div>
            </div>

            {/* Slider 2: Bán kính Trường (Field Radius) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#475569', fontWeight: '600' }}>Bán kính Trường:</span>
                <span style={{ color: '#8b5cf6', fontWeight: '700' }}>{fieldRadius} px</span>
              </div>
              <input
                type="range"
                min="60"
                max="280"
                step="5"
                value={fieldRadius}
                onChange={e => setFieldRadius(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <span>60 px (Hẹp)</span>
                <span>280 px (Rộng)</span>
              </div>
            </div>

            {/* Slider 3: Cường độ Trường (Field Strength) - Giá trị âm */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#475569', fontWeight: '600' }}>Cường độ Trường (Âm):</span>
                <span style={{ color: '#ec4899', fontWeight: '700' }}>{fieldStrength.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="-0.05"
                max="-0.004"
                step="0.002"
                value={fieldStrength}
                onChange={e => setFieldStrength(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <span>-0.050 (Đẩy cực mạnh)</span>
                <span>-0.004 (Nâng nhẹ)</span>
              </div>
            </div>
          </div>

          {/* THẺ 2: HÀNH ĐỘNG SIM */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Play size={18} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Hành động Sim
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Nút bật/tắt Toggle */}
              <button
                type="button"
                onClick={() => setIsFieldActive(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isFieldActive ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  background: isFieldActive ? 'rgba(34, 197, 94, 0.08)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Power size={16} color={isFieldActive ? '#16a34a' : '#64748b'} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    Trường Kháng Trọng lực
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: isFieldActive ? '#22c55e' : '#cbd5e1',
                  color: '#ffffff'
                }}>
                  {isFieldActive ? 'BẬT' : 'TẮT'}
                </span>
              </button>

              {/* Nút Thêm Vật thể */}
              <button
                type="button"
                onClick={handleAddObject}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                <PlusCircle size={16} color="#0284c7" />
                <span>Thêm Vật thể ngẫu nhiên</span>
              </button>

              {/* Nút Reset Thế giới */}
              <button
                type="button"
                onClick={handleResetWorld}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #fee2e2',
                  background: '#fff5f5',
                  color: '#dc2626',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff5f5'}
              >
                <RotateCcw size={16} />
                <span>Reset Thế giới</span>
              </button>
            </div>
          </div>

          {/* THẺ 3: THÔNG TIN MÔ PHỎNG */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #bae6fd',
            color: '#0369a1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>
              <Sparkles size={16} />
              <span>Cơ chế Vật lý</span>
            </div>
            <p style={{ margin: 0, fontSize: '11.5px', lineHeight: '1.5', color: '#075985' }}>
              Mỗi khi con trỏ chuột di chuyển trong canvas, hệ thống tính toán khoảng cách Euclidean đến các khối hình. Lực phản trọng lực tác dụng trực tiếp theo trục thẳng đứng, giúp mô phỏng hiệu ứng không trọng lượng chân thực.
            </p>
          </div>

        </aside>

      </div>
    </div>
  );
}
